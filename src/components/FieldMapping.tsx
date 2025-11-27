import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { translations, Language } from "@/lib/translations";

interface FieldMappingProps {
  excelHeaders: string[];
  wordPlaceholders: string[];
  language: Language;
}

export const FieldMapping = ({
  excelHeaders,
  wordPlaceholders,
  language,
}: FieldMappingProps) => {
  const t = translations[language];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-6 mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {t.fieldMapping}
            </h3>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            {t.excelHeaders} ({excelHeaders.length})
          </h4>
          <div className="space-y-2">
            {excelHeaders.map((header, index) => (
              <div
                key={index}
                className="p-2 bg-muted rounded flex items-center justify-between"
              >
                <span className="text-sm text-foreground">{header}</span>
                <Badge variant="secondary">{index + 1}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            {t.wordPlaceholders} ({wordPlaceholders.length})
          </h4>
          <div className="space-y-2">
            {wordPlaceholders.map((placeholder, index) => (
              <div
                key={index}
                className="p-2 bg-muted rounded flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono text-foreground">
                  &lt;&lt;{placeholder}&gt;&gt;
                </span>
              </div>
            ))}
          </div>
          </div>
        </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
