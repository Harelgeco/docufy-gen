import { useState } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { translations, Language } from "@/lib/translations";

interface FileUploaderProps {
  title: string;
  description: string;
  accept: string;
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  language: Language;
}

export const FileUploader = ({
  title,
  description,
  accept,
  onFileSelect,
  selectedFile,
  language,
}: FileUploaderProps) => {
  const t = translations[language];
  const [dragDepth, setDragDepth] = useState(0);
  const isDragging = dragDepth > 0;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragDepth(0);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <Card
      onDragEnter={(e) => {
        e.preventDefault();
        setDragDepth((d) => d + 1);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
      onDrop={handleDrop}
      className={`p-8 border border-solid transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/10 scale-[1.02] shadow-lg ring-4 ring-primary/20"
          : "bg-dropzone border-dropzone-border hover:border-gold"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className={`p-4 rounded-full transition-colors ${
            isDragging ? "bg-primary text-primary-foreground animate-bounce" : "bg-card text-dropzone-icon"
          }`}
        >
          <Upload className="w-8 h-8" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className={`text-sm ${isDragging ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {isDragging
              ? language === "he"
                ? "שחרר את הקובץ כאן"
                : "Drop the file here"
              : description}
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
            {selectedFile ? selectedFile.name : t.chooseFile}
          </div>
        </label>
        {selectedFile && (
          <p className="text-xs text-muted-foreground">
            {t.fileSelected} {selectedFile.name}
          </p>
        )}
      </div>
    </Card>
  );
};
