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
import { UploadedImage } from "./ImageUploader";
import ImageModule from "docxtemplater-image-module-free";

interface ManualExportOptionsProps {
  disabled: boolean;
  wordFile: File;
  fieldValues: Record<string, string>;
  language: Language;
  images: UploadedImage[];
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

  return templateData;
};

// Convert base64 string to Uint8Array for browser compatibility
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Convert image File to base64 string (without prefix)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ManualExportOptions = ({
  disabled,
  wordFile,
  fieldValues,
  language,
  images,
}: ManualExportOptionsProps) => {
  const t = translations[language];
  const [generating, setGenerating] = useState(false);

  const generateDocument = async (): Promise<Blob | null> => {
    try {
      const data = await wordFile.arrayBuffer();
      const zip = new PizZip(data);

      // Configure image module for browser
      const imageOpts = {
        centered: false,
        fileType: "docx",
        getImage: (tagValue: string) => {
          // tagValue is base64 string - convert to Uint8Array
          return base64ToUint8Array(tagValue);
        },
        getSize: () => {
          return [400, 300]; // Default image size in pixels
        },
      };

      const imageModule = new ImageModule(imageOpts);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "<<", end: ">>" },
        modules: [imageModule],
      });

      // Build template data including images
      const templateData = buildTemplateData(fieldValues, language);

      // Convert images to base64 and add to template data
      if (images.length > 0) {
        const imageBase64List = await Promise.all(
          images.map((img) => fileToBase64(img.file))
        );
        
        // Add first image for simple placeholder (use %<<תמונות>> in template)
        if (imageBase64List[0]) {
          templateData["תמונות"] = imageBase64List[0];
          templateData["תמונה"] = imageBase64List[0];
          templateData["images"] = imageBase64List[0];
          templateData["image"] = imageBase64List[0];
        }
        
        // Add numbered images for multiple placeholders
        imageBase64List.forEach((base64, index) => {
          templateData[`תמונה${index + 1}`] = base64;
          templateData[`image${index + 1}`] = base64;
        });
      }

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
