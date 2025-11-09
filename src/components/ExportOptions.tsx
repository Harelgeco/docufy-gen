import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { renderAsync } from "docx-preview";
import html2pdf from "html2pdf.js";

interface ExportOptionsProps {
  disabled?: boolean;
  selectedCount: number;
  wordFile?: File;
  excelData?: any[];
  selectedNames?: string[];
  nameColumn?: string;
}

const normalizeKey = (s: string) =>
  (s ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/<br\s*\/?\>/gi, " ")
    .replace(/\r?\n|\r|\t/g, " ")
    .replace(/\(.+?\)/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildTemplateData = (row: Record<string, string>) => {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const v = value ?? "";
    mapped[key] = v;
    const simplified = normalizeKey(key);
    if (simplified && !(simplified in mapped)) mapped[simplified] = v;
  }
  return mapped;
};

export const ExportOptions = ({
  disabled,
  selectedCount,
  wordFile,
  excelData,
  selectedNames,
  nameColumn,
}: ExportOptionsProps) => {
  const generatePDFs = async () => {
    if (!wordFile || !excelData || !selectedNames || !nameColumn) {
      toast.error("Missing required data");
      return;
    }

    try {
      toast.info(`Generating ${selectedCount} PDF(s)... This may take a moment.`);
      const templateData = await wordFile.arrayBuffer();
      let successCount = 0;

      for (const name of selectedNames) {
        try {
          const rowData = excelData.find((row) => row[nameColumn] === name);
          if (!rowData) {
            toast.error(`Data not found for ${name}`);
            continue;
          }

          // Fill the template
          const zip = new PizZip(templateData);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "<<", end: ">>" },
          });

          doc.setData(buildTemplateData(rowData));
          doc.render();

          const outputBlob = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          // Create container for rendering
          const container = document.createElement('div');
          container.style.cssText = `
            position: absolute;
            left: -9999px;
            top: 0;
            width: 794px;
            min-height: 1123px;
            background: white;
            padding: 20px;
          `;
          document.body.appendChild(container);

          // Render the DOCX with full fidelity
          await renderAsync(outputBlob, container, undefined, {
            className: "docx-wrapper",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
            debug: false,
          });

          // Wait for all resources to load
          await document.fonts.ready;
          
          // Wait for images to load
          const images = container.querySelectorAll('img');
          await Promise.all(
            Array.from(images).map((img: HTMLImageElement) =>
              new Promise<void>((resolve) => {
                if (img.complete) resolve();
                else {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                  setTimeout(() => resolve(), 3000); // timeout fallback
                }
              })
            )
          );

          // Extra delay for layout settling
          await new Promise(resolve => setTimeout(resolve, 500));

          const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_')}.pdf`;
          
          // Get the rendered content
          const content = container.querySelector('.docx') as HTMLElement || container;

          // Generate PDF with high quality settings
          await html2pdf()
            .set({
              margin: 0,
              filename: fileName,
              image: { 
                type: 'jpeg', 
                quality: 1.0 
              },
              html2canvas: { 
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                letterRendering: true,
                imageTimeout: 0,
                removeContainer: false,
                scrollX: 0,
                scrollY: 0,
              },
              jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
              },
            })
            .from(content)
            .save();

          document.body.removeChild(container);
          successCount++;
          
          // Small delay between files
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error generating PDF for ${name}:`, error);
          toast.error(`Failed to generate PDF for ${name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully generated ${successCount} PDF(s)!`);
      }
    } catch (error) {
      console.error('Error in PDF generation:', error);
      toast.error('Failed to generate PDFs');
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Export Options</h3>
      <div className="space-y-3">
        <Button className="w-full justify-start" disabled={disabled} onClick={generatePDFs}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF(s)
        </Button>
      </div>
      {selectedCount > 0 && (
        <p className="mt-4 text-sm text-center text-muted-foreground">
          {selectedCount} document{selectedCount > 1 ? 's' : ''} selected
        </p>
      )}
    </Card>
  );
};
