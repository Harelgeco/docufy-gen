import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

interface ExportOptionsProps {
  disabled?: boolean;
  selectedCount: number;
  wordFile?: File;
  excelData?: any[];
  selectedNames?: string[];
  nameColumn?: string;
}

export const ExportOptions = ({
  disabled,
  selectedCount,
  wordFile,
  excelData,
  selectedNames,
  nameColumn,
}: ExportOptionsProps) => {
  const generatePDFs = async () => {
    if (!wordFile || !excelData || !selectedNames || !nameColumn) {
      toast.error("Missing required data");
      return;
    }

    try {
      toast.info(`Generating ${selectedCount} document(s)...`);

      const templateData = await wordFile.arrayBuffer();

      for (const name of selectedNames) {
        // Find the row data for this person
        const rowData = excelData.find((row) => row[nameColumn] === name);
        
        if (!rowData) {
          toast.error(`Data not found for ${name}`);
          continue;
        }

        // Create a copy of the template
        const zip = new PizZip(templateData);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Set the template data - map Excel columns to placeholders
        doc.setData(rowData);

        try {
          doc.render();
        } catch (error) {
          console.error("Error rendering document:", error);
          toast.error(`Failed to generate document for ${name}`);
          continue;
        }

        // Generate the document
        const output = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Save the file
        const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")}.docx`;
        saveAs(output, fileName);
      }

      toast.success(`Generated ${selectedCount} document(s) successfully!`);
    } catch (error) {
      console.error("Error generating documents:", error);
      toast.error("Failed to generate documents");
    }
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
          onClick={generatePDFs}
        >
          <Download className="mr-2 h-4 w-4" />
          Generate Documents
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
