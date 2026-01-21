import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eraser, Calendar } from "lucide-react";
import { translations, Language } from "@/lib/translations";
import { SmartFieldInput, isAutoFilledField, getFieldType } from "./SmartFieldInput";
import { UploadedImage } from "./ImageUploader";

interface ManualFieldsFormProps {
  placeholders: string[];
  fieldValues: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onClear: () => void;
  language: Language;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
}

export const ManualFieldsForm = ({
  placeholders,
  fieldValues,
  onFieldChange,
  onClear,
  language,
  images,
  onImagesChange,
}: ManualFieldsFormProps) => {
  const t = translations[language];

  // Filter out auto-filled fields
  const visiblePlaceholders = placeholders.filter(
    (p) => !isAutoFilledField(p)
  );

  // Group placeholders: regular fields first, then images
  const regularFields = visiblePlaceholders.filter(
    (p) => getFieldType(p) !== "images"
  );
  const imageFields = visiblePlaceholders.filter(
    (p) => getFieldType(p) === "images"
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t.fillFields}</h3>
          <p className="text-sm text-muted-foreground">{t.fillFieldsDesc}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Eraser className="w-4 h-4 mr-2" />
          {t.clearFields}
        </Button>
      </div>

      {/* Auto-filled fields notice */}
      {placeholders.some(isAutoFilledField) && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {language === "he"
              ? "תאריך נוכחי יתמלא אוטומטית"
              : "Current date will be filled automatically"}
          </span>
        </div>
      )}

      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        {/* Regular fields */}
        {regularFields.map((placeholder) => (
          <div key={placeholder} className="space-y-2">
            <Label htmlFor={placeholder} className="text-sm font-medium">
              {placeholder}
            </Label>
            <SmartFieldInput
              fieldName={placeholder}
              value={fieldValues[placeholder] || ""}
              onChange={(value) => onFieldChange(placeholder, value)}
              language={language}
            />
          </div>
        ))}

        {/* Image fields */}
        {imageFields.map((placeholder) => (
          <div key={placeholder} className="space-y-2 pt-4 border-t">
            <Label htmlFor={placeholder} className="text-sm font-medium">
              {placeholder}
            </Label>
            <SmartFieldInput
              fieldName={placeholder}
              value=""
              onChange={() => {}}
              language={language}
              images={images}
              onImagesChange={onImagesChange}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};
