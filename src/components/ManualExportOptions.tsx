import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, File, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { PDFGenerator } from "@/lib/pdfGenerator";
import { translations, Language } from "@/lib/translations";
import { UploadedImage } from "./ImageUploader";
import ImageModule from "docxtemplater-image-module-free";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
  // Handle data URL format if present
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Convert image File to base64 data URL
const fileToBase64DataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
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

      // Configure image module for browser with proper options
      const imageOpts = {
        centered: false,
        fileType: "docx" as const,
        getImage: (tagValue: string) => {
          // tagValue is base64 data URL - convert to Uint8Array
          return base64ToUint8Array(tagValue);
        },
        getSize: (img: Uint8Array, tagValue: string, tagName: string) => {
          // Return default size - you can customize based on tagName if needed
          return [400, 300]; // Width x Height in pixels
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

      // Convert images to base64 data URLs and add to template data
      if (images.length > 0) {
        const imageDataUrls = await Promise.all(
          images.map((img) => fileToBase64DataUrl(img.file))
        );
        
        // Add first image for simple placeholder
        // Template should use: %<<תמונות>> or %<<image>>
        if (imageDataUrls[0]) {
          templateData["תמונות"] = imageDataUrls[0];
          templateData["תמונה"] = imageDataUrls[0];
          templateData["images"] = imageDataUrls[0];
          templateData["image"] = imageDataUrls[0];
        }
        
        // Add numbered images for multiple placeholders
        // Template should use: %<<תמונה1>>, %<<תמונה2>>, etc.
        imageDataUrls.forEach((dataUrl, index) => {
          templateData[`תמונה${index + 1}`] = dataUrl;
          templateData[`image${index + 1}`] = dataUrl;
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

  const hasImages = images.length > 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        {t.exportOptions}
      </h3>

      {/* Image syntax notice */}
      {hasImages && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {language === "he" ? "שים לב" : "Note"}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {language === "he"
              ? "כדי שתמונות יופיעו במסמך, התבנית צריכה להכיל %<<תמונות>> או %<<תמונה1>>"
              : "For images to appear in the document, the template must contain %<<images>> or %<<image1>>"}
          </AlertDescription>
        </Alert>
      )}

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
