import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Mail, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportOptionsProps {
  disabled?: boolean;
  selectedCount: number;
}

export const ExportOptions = ({
  disabled,
  selectedCount,
}: ExportOptionsProps) => {
  const { toast } = useToast();

  const handleExport = (action: string) => {
    toast({
      title: `${action} initiated`,
      description: `Processing ${selectedCount} document${
        selectedCount > 1 ? "s" : ""
      }...`,
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Export Options
      </h3>
      <div className="space-y-3">
        <Button
          className="w-full justify-start"
          disabled={disabled}
          onClick={() => handleExport("Save as PDF")}
        >
          <Download className="mr-2 h-4 w-4" />
          Save as PDF
        </Button>
        <Button
          className="w-full justify-start"
          variant="secondary"
          disabled={disabled}
          onClick={() => handleExport("Email")}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send via Email
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          disabled={disabled}
          onClick={() => handleExport("Save and Send")}
        >
          <FileCheck className="mr-2 h-4 w-4" />
          Save and Send
        </Button>
      </div>
      {selectedCount > 0 && (
        <p className="mt-4 text-sm text-center text-muted-foreground">
          {selectedCount} document{selectedCount > 1 ? "s" : ""} selected
        </p>
      )}
    </Card>
  );
};
