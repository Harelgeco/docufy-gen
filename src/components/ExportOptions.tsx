import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import html2pdf from "html2pdf.js";

interface ExportOptionsProps {
  disabled?: boolean;
  selectedCount: number;
  wordFile?: File;
  excelData?: any[];
  selectedNames?: string[];
  nameColumn?: string;
}

export const ExportOptions = ({
  disabled,
  selectedCount,
  wordFile,
  excelData,
  selectedNames,
  nameColumn,
}: ExportOptionsProps) => {
  const normalizeKey = (s: string) =>
    (s ?? "")
      .replace(/\u00A0/g, " ")
      .replace(/<br\s*\/?\>/gi, " ")
      .replace(/\r?\n|\r|\t/g, " ")
      .replace(/\(.+?\)/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // Build mapping with original and normalized keys
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

  const waitForImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
    // Convert blob-src images to data URLs to avoid canvas taint
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute('src') || '';
        if (src.startsWith('data:')) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          img.setAttribute('src', dataUrl);
        } catch (e) {
          // If conversion fails, leave as is
          console.warn('Image inline failed', e);
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

        const filled = buildTemplateData(rowData);
        doc.setData(filled);
        doc.render();

        const outputBlob = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Render to DOM with docx-preview, then capture as PDF
        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left = '-10000px';
        temp.style.top = '0';
        temp.style.width = '794px'; // A4 width @ 96dpi
        temp.style.background = '#ffffff';
        document.body.appendChild(temp);

        await (window as any).docx && (window as any).docx.renderAsync
          ? (window as any).docx.renderAsync(outputBlob, temp)
          : (await import('docx-preview')).renderAsync(outputBlob, temp, undefined, { useBase64URL: true });

        await document.fonts.ready.catch(() => {});
        await waitForImages(temp);
        await new Promise((r) => setTimeout(r, 200));

        const node = (temp.querySelector('.docx') as HTMLElement) || temp;
        const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_')}.pdf`;

        const instance: any = (html2pdf as any)();
        await instance
          .set({
            margin: 10,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', allowTaint: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          } as any)
          .from(node)
          .save();

        document.body.removeChild(temp);
      }

      toast.success(`Generated ${selectedCount} PDF(s) successfully!`);
    } catch (error) {
      console.error('Error generating PDFs:', error);
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
