import { useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { renderAsync } from "docx-preview";

interface DocumentPreviewProps {
  templateName?: string;
  selectedName?: string;
  excelData?: any[];
  wordPlaceholders?: string[];
  nameColumn?: string;
  wordFile?: File;
}

// Build template data: original headers + simplified keys (no parentheses, collapsed spaces)
const buildTemplateData = (row: Record<string, string>) => {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[key] = value ?? "";
    const simplified = key
      .replace(/\(.+?\)/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (simplified && !(simplified in mapped)) mapped[simplified] = value ?? "";
  }
  return mapped;
};

export const DocumentPreview = ({
  templateName,
  selectedName,
  excelData,
  wordPlaceholders,
  nameColumn,
  wordFile,
}: DocumentPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the data row for the selected name
  const selectedRow = useMemo(
    () => excelData?.find((row) => row[nameColumn || ""] === selectedName),
    [excelData, nameColumn, selectedName]
  );

  useEffect(() => {
    const doRender = async () => {
      if (!wordFile || !selectedRow || !containerRef.current) return;
      try {
        const data = await wordFile.arrayBuffer();
        const zip = new PizZip(data);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: "<<", end: ">>" },
        });
        doc.setData(buildTemplateData(selectedRow));
        doc.render();
        const out = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        containerRef.current.innerHTML = "";
        await renderAsync(out, containerRef.current);
      } catch (e) {
        console.error("Preview render failed", e);
      }
    };
    doRender();
  }, [wordFile, selectedRow]);

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Document Preview</h3>
      {templateName && selectedName && selectedRow ? (
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="p-4 bg-muted rounded-lg overflow-auto max-h-[600px]"
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
            <div className="p-4 border-2 border-border rounded-lg" dir="rtl">
              <p className="text-sm font-semibold mb-3 text-foreground">
                Data that will be filled:
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start gap-2 p-2 bg-muted rounded text-right"
                  >
                    <span className="text-sm font-medium text-foreground min-w-[150px]">
                      {key}:
                    </span>
                    <span className="text-sm text-muted-foreground flex-1">
                      {(value as string) || "(ריק)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
          <p className="text-muted-foreground">
            {!templateName || !selectedName
              ? "Upload files and select a name to see preview"
              : "Select a name to see data preview"}
          </p>
        </div>
      )}
    </Card>
  );
};
