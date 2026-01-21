import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";
import { translations, Language } from "@/lib/translations";

interface ManualFieldsFormProps {
  placeholders: string[];
  fieldValues: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onClear: () => void;
  language: Language;
}

export const ManualFieldsForm = ({
  placeholders,
  fieldValues,
  onFieldChange,
  onClear,
  language,
}: ManualFieldsFormProps) => {
  const t = translations[language];

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

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {placeholders.map((placeholder) => (
          <div key={placeholder} className="space-y-2">
            <Label htmlFor={placeholder} className="text-sm font-medium">
              {placeholder}
            </Label>
            <Input
              id={placeholder}
              value={fieldValues[placeholder] || ""}
              onChange={(e) => onFieldChange(placeholder, e.target.value)}
              placeholder={`${language === "he" ? "הכנס" : "Enter"} ${placeholder}`}
              dir="auto"
            />
          </div>
        ))}
      </div>
    </Card>
  );
};
