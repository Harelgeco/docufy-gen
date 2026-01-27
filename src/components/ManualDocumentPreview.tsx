import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { renderAsync } from "docx-preview";
import { translations, Language } from "@/lib/translations";
import ImageModule from "docxtemplater-image-module-free";
import { UploadedImage } from "@/components/ImageUploader";

interface ManualDocumentPreviewProps {
  wordFile: File;
  fieldValues: Record<string, string>;
  language: Language;
  images?: UploadedImage[];
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
  images = [],
}: ManualDocumentPreviewProps) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert base64 data URL to ArrayBuffer for docxtemplater-image-module-free
  const base64DataURLToArrayBuffer = (dataURL: string): ArrayBuffer | false => {
    const base64Regex =
      /^data:image\/(png|jpg|jpeg|gif|svg|svg\+xml|webp);base64,/;
    if (!base64Regex.test(dataURL)) {
      return false;
    }
    const stringBase64 = dataURL.replace(base64Regex, "");
    const binaryString = window.atob(stringBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const fileToBase64DataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    const renderPreview = async () => {
      if (!wordFile || !containerRef.current) return;

      try {
        setError(null);
        const data = await wordFile.arrayBuffer();
        const zip = new PizZip(data);

        const imageModule = new ImageModule({
          centered: false,
          fileType: "docx" as const,
          getImage: (tagValue: string) => base64DataURLToArrayBuffer(tagValue),
          getSize: () => [400, 300],
        });

        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: "<<", end: ">>" },
          modules: [imageModule],
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

        // Add images (for {%תמונות} / {%images} tags)
        if (images.length > 0) {
          const imageDataUrls = await Promise.all(
            images.map((img) => fileToBase64DataUrl(img.file))
          );

          if (imageDataUrls[0]) {
            templateData["תמונות"] = imageDataUrls[0];
            templateData["תמונה"] = imageDataUrls[0];
            templateData["images"] = imageDataUrls[0];
            templateData["image"] = imageDataUrls[0];
          }

          imageDataUrls.forEach((dataUrl, index) => {
            templateData[`תמונה${index + 1}`] = dataUrl;
            templateData[`image${index + 1}`] = dataUrl;
          });
        }

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
  }, [wordFile, fieldValues, language, images]);

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
