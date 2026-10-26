import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { renderAsync } from "docx-preview";
import { translations, Language } from "@/lib/translations";

interface DocumentPreviewProps {
  templateName?: string;
  selectedName?: string;
  excelData?: any[];
  nameColumn?: string;
  wordFile?: File;
  language: Language;
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

const buildTemplateData = (row: Record<string, string>, language: string) => {
  const mapped: Record<string, string> = {};
  const currentDate = new Date().toLocaleDateString(language === "he" ? "he-IL" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  for (const k of ["תאריך נוכחי", "תאריך היום", "date", "today", "current date"]) mapped[k] = currentDate;
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
  language,
}: DocumentPreviewProps) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const previewDataRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const hasPreview = Boolean(templateName && selectedName);

  useEffect(() => {
    const renderPreview = async () => {
      // Only render when the panel is actually open (it is closed by default).
      if (!open) return;
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

        doc.render(buildTemplateData(rowData, language));

        // Generate filled DOCX blob
        const outputBlob = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Clear container and render with docx-preview to preserve formatting
        containerRef.current.innerHTML = "";
        await renderAsync(outputBlob, containerRef.current, undefined, {
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

        // Ensure images are loaded
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
          const emptyText = language === "he" ? "(ריק)" : "(empty)";
          item.innerHTML = `
            <span class="text-sm font-medium text-foreground min-w-[150px]">${key}:</span>
            <span class="text-sm text-muted-foreground flex-1">${value || emptyText}</span>
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
  }, [open, wordFile, selectedName, excelData, nameColumn, language]);

  const subtitle = !hasPreview
    ? t.uploadToPreview
    : open
      ? `${templateName} · ${selectedName}`
      : t.previewExpandHint;

  return (
    <Card className="h-full p-0 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          disabled={!hasPreview}
          className={`flex w-full items-center justify-between gap-4 p-6 text-start transition-colors ${
            hasPreview ? "hover:bg-muted/60 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="min-w-0">
            <span className="block text-lg font-semibold text-foreground">
              {t.documentPreview}
            </span>
            <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>
          </div>
          <ChevronDown
            aria-hidden
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-4">
            <div
              ref={containerRef}
              className="border rounded-lg overflow-auto max-h-[600px] bg-white p-4"
              style={{ minHeight: "400px" }}
            />
            <div className="space-y-2">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t.template}</p>
                <p className="font-medium text-foreground">{templateName}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t.selectedName}</p>
                <p className="font-medium text-foreground">{selectedName}</p>
              </div>
              <div className="p-4 border-2 border-border rounded-lg">
                <p className="text-sm font-semibold mb-3 text-foreground">{t.dataToFill}</p>
                <div ref={previewDataRef} className="max-h-[300px] overflow-y-auto" />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
