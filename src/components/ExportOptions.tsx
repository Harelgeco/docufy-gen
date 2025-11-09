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

          // Fill the template
          const zip = new PizZip(templateData);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "<<", end: ">>" },
          });

          doc.render(buildTemplateData(rowData));

          // Generate filled DOCX blob
          const outputBlob = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          // Render into a visible container to ensure full layout (docx-preview preserves shapes/lines)
          const container = document.createElement("div");
          container.style.cssText = `position: fixed; left: 0; top: 0; width: 794px; min-height: 1123px; background: white; padding: 0; opacity: 0; pointer-events: none; z-index: 1;`;
          document.body.appendChild(container);

          // Wait fonts
          await document.fonts.ready.catch(() => {});

          // Render DOCX with images embedded
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
          // Ensure layout settled
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

          // Wait images
          const imgs = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
          await Promise.all(
            imgs.map(
              (img) =>
                new Promise<void>((resolve) => {
                  if (img.complete && img.naturalWidth > 0) return resolve();
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                  setTimeout(() => resolve(), 10000);
                })
            )
          );

          const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")}.pdf`;

          await (html2pdf as any)()
            .set({
              margin: 0,
              filename: fileName,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            })
            .from(container)
            .save();

          document.body.removeChild(container);
          successCount++;
          await new Promise((r) => setTimeout(r, 300));
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
        <Button className="w-full justify-start" disabled={disabled} onClick={generatePDFs}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF(s)
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
