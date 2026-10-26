import { useState, useEffect } from "react";
import { FileUploader } from "@/components/FileUploader";
import { ManualFieldsForm } from "@/components/ManualFieldsForm";
import { ManualDocumentPreview } from "@/components/ManualDocumentPreview";
import { ManualExportOptions } from "@/components/ManualExportOptions";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { translations, Language } from "@/lib/translations";
import { UploadedImage } from "@/components/ImageUploader";

const ManualEntry = () => {
  const [wordFile, setWordFile] = useState<File>();
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [hasImagePlaceholder, setHasImagePlaceholder] = useState(false);

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("preferred-language");
    return (saved === "he" || saved === "en") ? saved : "he";
  });
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem("preferred-language", language);
  }, [language]);

  useEffect(() => {
    if (wordFile) {
      parseWordTemplate(wordFile);
    }
  }, [wordFile]);

  const parseWordTemplate = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const zip = new PizZip(data);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "<<", end: ">>" },
      });

      // Read text directly from every Word part (body, headers, footers),
      // paragraph by paragraph, so placeholders split across runs/fields are found.
      const decode = (s: string) =>
        s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
         .replace(/&apos;/g, "'").replace(/&amp;/g, "&");
      const parts = Object.keys(zip.files).filter((n) =>
        /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n)
      );
      let allText = doc.getFullText() + "\n";
      let imgTag = false;
      for (const name of parts) {
        const xml = zip.file(name)?.asText() || "";
        for (const para of xml.split(/<\/w:p>/)) {
          const texts = [...para.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => decode(m[1]));
          const line = texts.join("");
          allText += line + "\n";
          if (/\{%[^}]+\}/.test(line)) imgTag = true;
        }
      }
      setHasImagePlaceholder(imgTag);
      const matches = [...allText.matchAll(/<<([^<>]+)>>/g)].map((m) =>
        m[1].replace(/\s+/g, " ").trim()
      );

      if (matches.length) {
        const uniquePlaceholders = [...new Set(matches)].filter(Boolean);
        setPlaceholders(uniquePlaceholders);
        
        // Initialize empty field values
        const initialValues: Record<string, string> = {};
        uniquePlaceholders.forEach((p) => {
          initialValues[p] = "";
        });
        setFieldValues(initialValues);
        
        toast.success(
          language === "he"
            ? `נמצאו ${uniquePlaceholders.length} שדות בתבנית`
            : `Found ${uniquePlaceholders.length} fields in template`
        );
      } else {
        setPlaceholders([]);
        setFieldValues({});
        toast.warning(t.noPlaceholders);
      }
    } catch (error) {
      console.error("Error parsing Word template:", error);
      toast.error(
        language === "he"
          ? "שגיאה בקריאת קובץ התבנית"
          : "Failed to parse Word template"
      );
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFields = () => {
    const clearedValues: Record<string, string> = {};
    placeholders.forEach((p) => {
      clearedValues[p] = "";
    });
    setFieldValues(clearedValues);
    setImages([]);
  };

  const isFormValid =
    images.length > 0 || placeholders.some((p) => fieldValues[p]?.trim() !== "");

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            {t.manualHeroTitle}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.manualHeroDescription}
          </p>
        </div>

        {/* Template Upload */}
        <div className="max-w-xl mx-auto mb-12">
          <FileUploader
            title={t.uploadWord}
            description={t.uploadWordDesc}
            accept=".docx,.doc"
            onFileSelect={setWordFile}
            selectedFile={wordFile}
            language={language}
          />
        </div>

        {/* Form and Preview */}
        {wordFile && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <ManualFieldsForm
                placeholders={placeholders}
                fieldValues={fieldValues}
                onFieldChange={handleFieldChange}
                onClear={handleClearFields}
                language={language}
                images={images}
                onImagesChange={setImages}
                hasImagePlaceholder={hasImagePlaceholder}
              />
              <ManualExportOptions
                disabled={!isFormValid}
                wordFile={wordFile}
                fieldValues={fieldValues}
                language={language}
                images={images}
              />
            </div>
            <div className="lg:col-span-2">
              <ManualDocumentPreview
                wordFile={wordFile}
                fieldValues={fieldValues}
                language={language}
                images={images}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!wordFile && (
          <div className="text-center py-12 text-muted-foreground">
            {t.uploadTemplateToStart}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManualEntry;
