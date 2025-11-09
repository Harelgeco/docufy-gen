import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
// Use Mammoth browser build to convert DOCX -> HTML with inline images
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mammoth from "mammoth/mammoth.browser";

interface DocumentPreviewProps {
  templateName?: string;
  selectedName?: string;
  excelData?: any[];
  nameColumn?: string;
  wordFile?: File;
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

export const DocumentPreview = ({
  templateName,
  selectedName,
  excelData,
  nameColumn,
  wordFile,
}: DocumentPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewDataRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderPreview = async () => {
      if (!wordFile || !selectedName || !excelData || !nameColumn || !containerRef.current || !previewDataRef.current) {
        return;
      }

      try {
        const rowData = excelData.find((row) => row[nameColumn] === selectedName);
        if (!rowData) return;

        // Read the Word template and fill placeholders
        const data = await wordFile.arrayBuffer();
        const zip = new PizZip(data);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: "<<", end: ">>" },
        });

        doc.setData(buildTemplateData(rowData));
        doc.render();

        // Generate ArrayBuffer and convert to HTML with Mammoth (images inlined as base64)
        const filledBuffer: ArrayBuffer = doc.getZip().generate({ type: "arraybuffer" });
        const result = await mammoth.convertToHtml(
          { arrayBuffer: filledBuffer },
          {
            convertImage: mammoth.images.inline(async (element: any) => {
              const base64 = await element.read("base64");
              return { src: `data:${element.contentType};base64,${base64}` };
            }),
          }
        );

        // Render HTML into container
        const html = result.value as string;
        containerRef.current.innerHTML = `<div class="mammoth-doc" dir="rtl">${html}</div>`;

        // Ensure images are loaded before finishing
        const images = Array.from(containerRef.current.querySelectorAll("img")) as HTMLImageElement[];
        await Promise.all(
          images.map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalWidth > 0) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(() => resolve(), 5000);
              })
          )
        );

        // Show data mapping list
        previewDataRef.current.innerHTML = "";
        const dataList = document.createElement("div");
        dataList.className = "space-y-2";
        Object.entries(rowData).forEach(([key, value]) => {
          const item = document.createElement("div");
          item.className = "flex items-start gap-2 p-2 bg-muted rounded text-right";
          item.dir = "rtl";
          item.innerHTML = `
            <span class="text-sm font-medium text-foreground min-w-[150px]">${key}:</span>
            <span class="text-sm text-muted-foreground flex-1">${value || "(ריק)"}</span>
          `;
          dataList.appendChild(item);
        });
        previewDataRef.current.appendChild(dataList);
      } catch (error) {
        console.error("Preview render error:", error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<p class="text-destructive">Failed to render preview</p>`;
        }
      }
    };

    renderPreview();
  }, [wordFile, selectedName, excelData, nameColumn]);

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Document Preview</h3>
      {templateName && selectedName ? (
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="border rounded-lg overflow-auto max-h-[600px] bg-white p-4"
            style={{ minHeight: "400px" }}
          />
          <div className="space-y-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium text-foreground">{templateName}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Selected Name</p>
              <p className="font-medium text-foreground">{selectedName}</p>
            </div>
            <div className="p-4 border-2 border-border rounded-lg">
              <p className="text-sm font-semibold mb-3 text-foreground">Data that will be filled:</p>
              <div ref={previewDataRef} className="max-h-[300px] overflow-y-auto" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
          <p className="text-muted-foreground">Upload files and select a name to see preview</p>
        </div>
      )}
    </Card>
  );
};
