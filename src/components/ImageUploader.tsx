import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ImagePlus, X, GripVertical } from "lucide-react";
import { Language } from "@/lib/translations";

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  language: Language;
}

export const ImageUploader = ({
  images,
  onImagesChange,
  language,
}: ImageUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter((img) => img.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onImagesChange(
      images.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("image-input")?.click()}
      >
        <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {language === "he"
            ? "גרור תמונות לכאן או לחץ לבחירה"
            : "Drag images here or click to select"}
        </p>
        <input
          id="image-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((image, index) => (
            <Card key={image.id} className="p-3">
              <div className="flex gap-3 items-start">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                </div>
                <img
                  src={image.preview}
                  alt={image.caption || `Image ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Input
                    value={image.caption}
                    onChange={(e) =>
                      handleCaptionChange(image.id, e.target.value)
                    }
                    placeholder={
                      language === "he" ? "כותרת התמונה..." : "Image caption..."
                    }
                    className="mb-1"
                    dir="auto"
                  />
                  <p className="text-xs text-muted-foreground truncate">
                    {image.file.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveImage(image.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {language === "he"
            ? `${images.length} תמונות נבחרו`
            : `${images.length} images selected`}
        </p>
      )}
    </div>
  );
};
