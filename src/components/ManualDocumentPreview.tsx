import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { renderAsync } from "docx-preview";
import { translations, Language } from "@/lib/translations";

interface ManualDocumentPreviewProps {
  wordFile: File;
  fieldValues: Record<string, string>;
  language: Language;
}

const normalizeKey = (s: string) =>
  s
    .replace(/\u00A0/g, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const ManualDocumentPreview = ({
  wordFile,
  fieldValues,
  language,
}: ManualDocumentPreviewProps) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPreview = async () => {
      if (!wordFile || !containerRef.current) return;

      try {
        setError(null);
        const data = await wordFile.arrayBuffer();
        const zip = new PizZip(data);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "<<", end: ">>" },
      });

        // Build template data from field values
        const templateData: Record<string, string> = {};
        Object.entries(fieldValues).forEach(([key, value]) => {
          const normalizedKey = normalizeKey(key);
          // Format date values for display
          if (value && !isNaN(Date.parse(value))) {
            const date = new Date(value);
            templateData[normalizedKey] = date.toLocaleDateString(
              language === "he" ? "he-IL" : "en-US"
            );
          } else {
            templateData[normalizedKey] = value || "";
          }
        });

        // Add current date automatically
        const today = new Date();
        const dateStr = today.toLocaleDateString(language === "he" ? "he-IL" : "en-US");
        templateData["תאריך נוכחי"] = dateStr;
        templateData["תאריך היום"] = dateStr;
        templateData["תאריך"] = dateStr;
        templateData["date"] = dateStr;
        templateData["current date"] = dateStr;
        templateData["today"] = dateStr;

        doc.render(templateData);

        const outputBlob = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        containerRef.current.innerHTML = "";
        await renderAsync(outputBlob, containerRef.current, undefined, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      } catch (err) {
        console.error("Error rendering preview:", err);
        setError(
          language === "he"
            ? "שגיאה בטעינת התצוגה המקדימה"
            : "Error loading preview"
        );
      }
    };

    renderPreview();
  }, [wordFile, fieldValues, language]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        {t.documentPreview}
      </h3>

      {error ? (
        <div className="text-destructive text-center py-8">{error}</div>
      ) : (
        <div
          ref={containerRef}
          className="border rounded-lg overflow-auto max-h-[70vh] bg-white"
          style={{ minHeight: "400px" }}
        />
      )}

      {/* Show filled values */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
          {t.dataToFill}
        </h4>
        <div className="space-y-1">
          {Object.entries(fieldValues).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{key}:</span>
              <span className="font-medium text-foreground">
                {value || t.empty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
