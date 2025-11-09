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
      toast.info(`Generating ${selectedCount} PDF(s)... Please wait, this preserves all images and formatting.`);
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

          // Create visible container for proper rendering with images
          const container = document.createElement('div');
          container.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 794px;
            min-height: 1123px;
            background: white;
            padding: 20px;
            z-index: 99999;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
          `;
          document.body.appendChild(container);

          // Show loading message
          const loadingDiv = document.createElement('div');
          loadingDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 999999;';
          loadingDiv.textContent = `Generating PDF for ${name}... Please wait.`;
          document.body.appendChild(loadingDiv);

          // Render with all features enabled
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
            useBase64URL: false, // Critical: use regular URLs for images
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
            debug: false,
          });

          // Wait for fonts
          await document.fonts.ready;
          
          // Wait for ALL images to fully load - CRITICAL for images
          const images = container.querySelectorAll('img');
          console.log(`Found ${images.length} images in document`);
          
          await Promise.all(
            Array.from(images).map((img: HTMLImageElement, index) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                  console.log(`Image ${index} already loaded`);
                  resolve();
                } else {
                  img.onload = () => {
                    console.log(`Image ${index} loaded successfully`);
                    resolve();
                  };
                  img.onerror = (e) => {
                    console.error(`Image ${index} failed to load:`, e, img.src);
                    resolve();
                  };
                  setTimeout(() => {
                    console.warn(`Image ${index} load timeout`);
                    resolve();
                  }, 10000);
                }
              })
            )
          );

          // Extra wait for layout and rendering
          await new Promise(resolve => setTimeout(resolve, 1000));

          const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_')}.pdf`;
          
          const content = container.querySelector('.docx') as HTMLElement || container;

          // Generate PDF with maximum quality
          await html2pdf()
            .set({
              margin: 0,
              filename: fileName,
              image: { 
                type: 'jpeg', 
                quality: 0.98 
              },
              html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                letterRendering: true,
                imageTimeout: 15000,
                removeContainer: false,
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
          document.body.removeChild(loadingDiv);
          successCount++;
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error generating PDF for ${name}:`, error);
          toast.error(`Failed to generate PDF for ${name}: ${error}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully generated ${successCount} PDF(s)!`);
      }
    } catch (error) {
      console.error('Error in PDF generation:', error);
      toast.error(`Failed to generate PDFs: ${error}`);
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
        <p className="text-xs text-muted-foreground">
          PDFs preserve all images, headers, and formatting from the Word template.
        </p>
      </div>
      {selectedCount > 0 && (
        <p className="mt-4 text-sm text-center text-muted-foreground">
          {selectedCount} document{selectedCount > 1 ? 's' : ''} selected
        </p>
      )}
    </Card>
  );
};
