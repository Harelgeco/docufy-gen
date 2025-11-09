import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface FieldMappingProps {
  excelHeaders: string[];
  wordPlaceholders: string[];
}

export const FieldMapping = ({
  excelHeaders,
  wordPlaceholders,
}: FieldMappingProps) => {
  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Field Mapping
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Excel Headers ({excelHeaders.length})
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
            Word Placeholders ({wordPlaceholders.length})
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
    </Card>
  );
};
