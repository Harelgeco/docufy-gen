import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { renderAsync } from "docx-preview";
import html2pdf from "html2pdf.js";

interface ExportOptionsProps {
  disabled?: boolean;
  selectedCount: number;
  wordFile?: File;
  excelData?: any[];
  selectedNames?: string[];
  nameColumn?: string;
  language: "he" | "en";
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

const buildTemplateData = (row: Record<string, string>, language: "he" | "en") => {
  const mapped: Record<string, string> = {};
  
  // Add current date as <<תאריך נוכחי>> with selected language
  const locale = language === "he" ? "he-IL" : "en-US";
  const currentDate = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  mapped['תאריך נוכחי'] = currentDate;
  
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
  language,
}: ExportOptionsProps) => {
  const generateDocuments = async () => {
    if (!wordFile || !excelData || !selectedNames || !nameColumn) {
      toast.error("Missing required data");
      return;
    }

    try {
      toast.info(`Generating ${selectedCount} document(s)... Please wait.`);
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

          doc.render(buildTemplateData(rowData, language));

          // Generate filled DOCX blob
          const outputBlob = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")}.docx`;
          
          // Download the DOCX file directly
          saveAs(outputBlob, fileName);

          successCount++;
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          console.error("Document generation failed for", name, err);
          toast.error(`Failed to generate document for ${name}`);
        }
      }

      if (successCount > 0) toast.success(`Generated ${successCount} document(s)`);
    } catch (error) {
      console.error("Error in document generation:", error);
      toast.error("Failed to generate documents");
    }
  };

  const generatePDFs = async () => {
    if (!wordFile || !excelData || !selectedNames || !nameColumn) {
      toast.error("Missing required data");
      return;
    }

    try {
      toast.info(`Generating ${selectedCount} PDF(s)... Please wait.`);
      const templateData = await wordFile.arrayBuffer();
      let successCount = 0;

      for (const name of selectedNames) {
        try {
          const rowData = excelData.find((row) => row[nameColumn] === name);
          if (!rowData) {
            toast.error(`Data not found for ${name}`);
            continue;
          }

          // Fill the template - SAME AS WORD EXPORT
          const zip = new PizZip(templateData);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "<<", end: ">>" },
          });

          doc.render(buildTemplateData(rowData, language));

          // Generate filled DOCX blob - SAME AS WORD EXPORT
          const outputBlob = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          // Create print container with proper RTL and Hebrew support
          const printContainer = document.createElement("div");
          printContainer.style.cssText = `
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 210mm; 
            background: white; 
            padding: 0; 
            z-index: 2147483647;
            direction: rtl;
            font-family: 'David Libre', 'Arial', 'Noto Sans Hebrew', sans-serif;
          `;
          document.body.appendChild(printContainer);

          // Wait for fonts
          await document.fonts.ready.catch(() => {});

          // Render DOCX with all content preserved
          await renderAsync(outputBlob, printContainer, undefined, {
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

          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

          const docxWrapper = printContainer.querySelector(".docx-wrapper") as HTMLElement;
          if (docxWrapper) {
            docxWrapper.style.direction = "rtl";
            docxWrapper.style.textAlign = "right";
          }

          // Wait for images
          const imgs = Array.from(printContainer.querySelectorAll("img")) as HTMLImageElement[];
          await Promise.all(
            imgs.map(
              (img) =>
                new Promise<void>((resolve) => {
                  if (img.complete && img.naturalWidth > 0) return resolve();
                  img.onload = () => resolve();
                  img.onerror = () => {
                    console.warn("Image failed to load:", img.src);
                    resolve();
                  };
                  setTimeout(() => resolve(), 20000);
                })
            )
          );

          await new Promise((r) => setTimeout(r, 1000));

          const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")}.pdf`;

          // Use html2pdf with optimized settings for Hebrew/RTL
          await (html2pdf as any)()
            .set({
              margin: [10, 10, 10, 10],
              filename: fileName,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { 
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                logging: false,
                letterRendering: true,
                imageTimeout: 30000,
                removeContainer: false,
                scrollX: 0,
                scrollY: 0,
              },
              jsPDF: { 
                unit: "mm", 
                format: "a4", 
                orientation: "portrait",
                compress: true,
              },
              pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            })
            .from(printContainer)
            .save();

          document.body.removeChild(printContainer);
          successCount++;
          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          console.error("PDF generation failed for", name, err);
          toast.error(`Failed to generate PDF for ${name}`);
        }
      }

      if (successCount > 0) toast.success(`Generated ${successCount} PDF(s)`);
    } catch (error) {
      console.error("Error in PDF generation:", error);
      toast.error("Failed to generate PDFs");
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Export Options</h3>
      <div className="space-y-3">
        <Button className="w-full justify-start" disabled={disabled} onClick={generateDocuments}>
          <FileText className="mr-2 h-4 w-4" />
          Download as Word Document(s)
        </Button>
        <Button className="w-full justify-start" disabled={disabled} onClick={generatePDFs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download as PDF(s)
        </Button>
      </div>
      {selectedCount > 0 && (
        <p className="mt-4 text-sm text-center text-muted-foreground">
          {selectedCount} document{selectedCount > 1 ? "s" : ""} selected
        </p>
      )}
    </Card>
  );
};
