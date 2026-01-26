import { useState, useEffect, useRef } from "react";
import { FileUploader } from "@/components/FileUploader";
import { ManualFieldsForm } from "@/components/ManualFieldsForm";
import { ManualDocumentPreview } from "@/components/ManualDocumentPreview";
import { ManualExportOptions } from "@/components/ManualExportOptions";
import { Header } from "@/components/Header";
import { TemplateSelector, PREDEFINED_TEMPLATES, PredefinedTemplate } from "@/components/TemplateSelector";
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customFile, setCustomFile] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

      const fullText = doc.getFullText();
      const placeholderRegex = /<<([^>]+)>>/g;
      const matches = fullText.match(placeholderRegex);

      if (matches) {
        const extracted = matches.map((match) => match.replace(/<<|>>/g, ""));
        const uniquePlaceholders = [...new Set(extracted)];
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

  const handleSelectPredefinedTemplate = async (template: PredefinedTemplate) => {
    setSelectedTemplateId(template.id);
    
    try {
      // Fetch the template file from public folder
      const response = await fetch(template.path);
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      
      const blob = await response.blob();
      const file = new File([blob], template.name[language] + ".docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      
      setWordFile(file);
      toast.success(
        language === "he"
          ? `התבנית "${template.name.he}" נטענה בהצלחה`
          : `Template "${template.name.en}" loaded successfully`
      );
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error(
        language === "he"
          ? "שגיאה בטעינת התבנית"
          : "Error loading template"
      );
    }
  };

  const handleUploadCustomClick = () => {
    fileInputRef.current?.click();
  };

  const handleCustomFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomFile(file);
      setSelectedTemplateId("custom");
      setWordFile(file);
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

  const isFormValid = placeholders.length > 0 && 
    placeholders.some((p) => fieldValues[p]?.trim() !== "");

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

        {/* Template Selection */}
        <div className="max-w-xl mx-auto mb-12">
          <TemplateSelector
            language={language}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleSelectPredefinedTemplate}
            onUploadCustom={handleUploadCustomClick}
            customFile={customFile}
          />
          
          {/* Hidden file input for custom upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc"
            className="hidden"
            onChange={handleCustomFileSelect}
          />
        </div>

        {/* Form and Preview */}
        {wordFile && placeholders.length > 0 && (
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
