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

// Build a robust mapping for template: include original headers and normalized keys
const buildTemplateData = (row: Record<string, string>) => {
  const normalize = (s: string) =>
    (s ?? "")
      .replace(/\u00A0/g, " ")
      .replace(/<br\s*\/?\>/gi, " ")
      .replace(/\r?\n|\r|\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const v = value ?? "";
    // original header key
    mapped[key] = v;
    // simplified header (no parentheses, tags, line breaks, extra spaces)
    const simplified = normalize(key.replace(/\(.+?\)/g, "").replace(/<[^>]*>/g, ""));
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
  const inlineImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) return;
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.setAttribute('src', dataUrl);
          img.setAttribute('crossorigin', 'anonymous');
        } catch (e) {
          console.warn('Failed to inline image', src, e);
          // If we fail, remove the image to avoid tainting the canvas
          img.remove();
        }
      })
    );
  };
  const generatePDFs = async () => {
    if (!wordFile || !excelData || !selectedNames || !nameColumn) {
      toast.error("Missing required data");
      return;
    }

    try {
      toast.info(`Generating ${selectedCount} PDF(s)...`);

      const templateData = await wordFile.arrayBuffer();

      for (const name of selectedNames) {
        const rowData = excelData.find((row) => row[nameColumn] === name);
        if (!rowData) {
          toast.error(`Data not found for ${name}`);
          continue;
        }

        const zip = new PizZip(templateData);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: "<<", end: ">>" },
        });

        // Map Excel columns to placeholders robustly
        const dataForTemplate = buildTemplateData(rowData);
        doc.setData(dataForTemplate);

        try {
          doc.render();
        } catch (error) {
          console.error("Error rendering document:", error);
          toast.error(`Failed to generate document for ${name}`);
          continue;
        }

        // Generate DOCX blob and render to hidden container
        const outputBlob = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.top = "0";
        tempContainer.style.left = "0";
        tempContainer.style.width = "794px"; // ~A4 width @ 96dpi
        tempContainer.style.background = "white";
        tempContainer.style.zIndex = "9999";
        tempContainer.style.height = "auto";
        document.body.appendChild(tempContainer);

        await renderAsync(outputBlob, tempContainer);
        // Ensure layout and fonts are ready
        await new Promise((r) => setTimeout(r, 300));

        const target = (tempContainer.querySelector('.docx') as HTMLElement) || tempContainer;
        await inlineImages(target);

        const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")}.pdf`;

        await html2pdf()
          .set({
            margin: 10,
            filename: fileName,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", allowTaint: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(target)
          .save();

        document.body.removeChild(tempContainer);
      }

      toast.success(`Generated ${selectedCount} PDF(s) successfully!`);
    } catch (error) {
      console.error("Error generating PDFs:", error);
      toast.error("Failed to generate PDFs");
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Export Options
      </h3>
      <div className="space-y-3">
        <Button
          className="w-full justify-start"
          disabled={disabled}
          onClick={generatePDFs}
        >
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

