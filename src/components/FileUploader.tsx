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
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <Card className="p-8 border-2 border-dashed border-border hover:border-primary transition-colors">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center space-y-4"
      >
        <div className="p-4 rounded-full bg-muted">
          <Upload className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
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
