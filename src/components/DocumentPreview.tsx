import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewProps {
  templateName?: string;
  selectedName?: string;
  excelData?: any[];
  wordPlaceholders?: string[];
  nameColumn?: string;
}

export const DocumentPreview = ({
  templateName,
  selectedName,
  excelData,
  wordPlaceholders,
  nameColumn,
}: DocumentPreviewProps) => {
  // Find the data row for the selected name
  const selectedRow = excelData?.find(
    (row) => row[nameColumn || ""] === selectedName
  );

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Document Preview
      </h3>
      {templateName && selectedName && selectedRow ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            <FileText className="w-16 h-16 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium text-foreground">{templateName}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Selected Name</p>
              <p className="font-medium text-foreground">{selectedName}</p>
            </div>
            <div className="p-4 border-2 border-border rounded-lg">
              <p className="text-sm font-semibold mb-3 text-foreground">
                Data that will be filled in the document:
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start gap-2 p-2 bg-muted rounded text-right"
                    dir="rtl"
                  >
                    <span className="text-sm font-medium text-foreground min-w-[150px]">
                      {key}:
                    </span>
                    <span className="text-sm text-muted-foreground flex-1">
                      {(value as string) || "(ריק)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
          <p className="text-muted-foreground">
            {!templateName || !selectedName
              ? "Upload files and select a name to see preview"
              : "Select a name to see data preview"}
          </p>
        </div>
      )}
    </Card>
  );
};
