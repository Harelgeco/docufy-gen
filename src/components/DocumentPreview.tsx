import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface DocumentPreviewProps {
  templateName?: string;
  selectedName?: string;
}

export const DocumentPreview = ({
  templateName,
  selectedName,
}: DocumentPreviewProps) => {
  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Document Preview
      </h3>
      {templateName && selectedName ? (
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
            <div className="p-6 border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                Live preview will appear here
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
          <p className="text-muted-foreground">
            Upload files to see preview
          </p>
        </div>
      )}
    </Card>
  );
};
