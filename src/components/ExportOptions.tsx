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
  const generateDocuments = async () => {
    if (!wordFile || !excelData || !selectedNames || !nameColumn) {
      toast.error("Missing required data");
      return;
    }

    try {
      toast.info(`Generating ${selectedCount} document(s)...`);

      const templateData = await wordFile.arrayBuffer();
      let successCount = 0;

      for (const name of selectedNames) {
        const rowData = excelData.find((row) => row[nameColumn] === name);
        
        if (!rowData) {
          toast.error(`Data not found for ${name}`);
          continue;
        }

        try {
          // Create a fresh copy of the template for each person
          const zip = new PizZip(templateData);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "<<", end: ">>" },
          });

          // Fill the template with this person's data
          doc.setData(rowData);
          doc.render();

          // Generate the Word document
          const output = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          // Save the file
          const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")}.docx`;
          saveAs(output, fileName);
          successCount++;

          // Small delay between downloads to avoid browser issues
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error generating document for ${name}:`, error);
          toast.error(`Failed to generate document for ${name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully generated ${successCount} document(s)!`);
      }
    } catch (error) {
      console.error("Error in document generation:", error);
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
          onClick={generateDocuments}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Word Documents
        </Button>
        <p className="text-xs text-muted-foreground">
          Documents will be downloaded as .docx files. You can convert them to PDF using Word or other tools.
        </p>
      </div>
      {selectedCount > 0 && (
        <p className="mt-4 text-sm text-center text-muted-foreground">
          {selectedCount} document{selectedCount > 1 ? "s" : ""} selected
        </p>
      )}
    </Card>
  );
};
