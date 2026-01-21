import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, File } from "lucide-react";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { PDFGenerator } from "@/lib/pdfGenerator";
import { translations, Language } from "@/lib/translations";

interface ManualExportOptionsProps {
  disabled: boolean;
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

const buildTemplateData = (
  fieldValues: Record<string, string>,
  language: Language
) => {
  const templateData: Record<string, string> = {};
  Object.entries(fieldValues).forEach(([key, value]) => {
    const normalizedKey = normalizeKey(key);
    templateData[normalizedKey] = value || "";
  });

  // Add current date
  const today = new Date();
  const dateStr = today.toLocaleDateString(language === "he" ? "he-IL" : "en-US");
  templateData["תאריך"] = dateStr;
  templateData["date"] = dateStr;

  return templateData;
};

export const ManualExportOptions = ({
  disabled,
  wordFile,
  fieldValues,
  language,
}: ManualExportOptionsProps) => {
  const t = translations[language];
  const [generating, setGenerating] = useState(false);

  const generateDocument = async (): Promise<Blob | null> => {
    try {
      const data = await wordFile.arrayBuffer();
      const zip = new PizZip(data);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const templateData = buildTemplateData(fieldValues, language);
      doc.render(templateData);

      return doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    } catch (error) {
      console.error("Error generating document:", error);
      return null;
    }
  };

  const handleDownloadWord = async () => {
    setGenerating(true);
    try {
      const blob = await generateDocument();
      if (blob) {
        const fileName = `document_${new Date().toISOString().split("T")[0]}.docx`;
        saveAs(blob, fileName);
        toast.success(
          language === "he" ? "המסמך הורד בהצלחה" : "Document downloaded successfully"
        );
      } else {
        throw new Error("Failed to generate document");
      }
    } catch (error) {
      toast.error(
        language === "he" ? "שגיאה ביצירת המסמך" : "Error generating document"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const blob = await generateDocument();
      if (!blob) {
        throw new Error("Failed to generate document");
      }

      const pdfGenerator = new PDFGenerator();
      const fileName = `document_${new Date().toISOString().split("T")[0]}.pdf`;
      
      await pdfGenerator.generate({
        docxBlob: blob,
        fileName,
        onProgress: (status) => console.log("PDF Generation:", status),
      });
      
      toast.success(
        language === "he" ? "ה-PDF הורד בהצלחה" : "PDF downloaded successfully"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        language === "he" ? "שגיאה ביצירת ה-PDF" : "Error generating PDF"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        {t.exportOptions}
      </h3>

      <div className="space-y-3">
        <Button
          className="w-full"
          variant="outline"
          onClick={handleDownloadWord}
          disabled={disabled || generating}
        >
          <FileText className="w-4 h-4 mr-2" />
          {t.downloadWord}
        </Button>
        <Button
          className="w-full"
          onClick={handleDownloadPDF}
          disabled={disabled || generating}
        >
          <File className="w-4 h-4 mr-2" />
          {t.downloadPDF}
        </Button>
      </div>
    </Card>
  );
};
