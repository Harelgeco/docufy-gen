import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Check } from "lucide-react";
import { Language } from "@/lib/translations";

export interface PredefinedTemplate {
  id: string;
  name: { he: string; en: string };
  description: { he: string; en: string };
  path: string;
}

export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: "pikuach-elyon",
    name: {
      he: "פורמט פיקוח עליון",
      en: "High Supervision Format",
    },
    description: {
      he: "תבנית לדו\"ח פיקוח עליון עם שדות לתאריך, פרויקט והערות",
      en: "Template for high supervision report with date, project, and notes fields",
    },
    path: "/templates/פורמט_פיקוח_עליון.docx",
  },
];

interface TemplateSelectorProps {
  language: Language;
  selectedTemplateId: string | null;
  onSelectTemplate: (template: PredefinedTemplate) => void;
  onUploadCustom: () => void;
  customFile?: File;
}

export const TemplateSelector = ({
  language,
  selectedTemplateId,
  onSelectTemplate,
  onUploadCustom,
  customFile,
}: TemplateSelectorProps) => {
  const isCustomSelected = selectedTemplateId === "custom" && customFile;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {language === "he" ? "בחר תבנית" : "Select Template"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {language === "he"
          ? "בחר תבנית מוכנה מראש או העלה תבנית משלך"
          : "Choose a pre-defined template or upload your own"}
      </p>

      <div className="space-y-3">
        {/* Pre-defined templates */}
        {PREDEFINED_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
              selectedTemplateId === template.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border"
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">
                  {template.name[language]}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description[language]}
                </p>
              </div>
              {selectedTemplateId === template.id && (
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </div>
          </div>
        ))}

        {/* Custom upload option */}
        <div
          className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
            isCustomSelected
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border"
          }`}
          onClick={onUploadCustom}
        >
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground">
                {language === "he" ? "העלה תבנית משלך" : "Upload Custom Template"}
              </h4>
              {customFile ? (
                <p className="text-sm text-primary mt-1 truncate">
                  {customFile.name}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "he"
                    ? "קובץ Word עם שדות בפורמט <<שם שדה>>"
                    : "Word file with fields in <<field name>> format"}
                </p>
              )}
            </div>
            {isCustomSelected && (
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
