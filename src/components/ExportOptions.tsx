import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { renderAsync } from "docx-preview";
import html2pdf from "html2pdf.js";

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
      toast.info(`Generating ${selectedCount} PDF(s)...`);

      const templateData = await wordFile.arrayBuffer();

      for (const name of selectedNames) {
        const rowData = excelData.find((row) => row[nameColumn] === name);
        if (!rowData) {
          toast.error(`Data not found for ${name}`);
          continue;
        }

        const zip = new PizZip(templateData);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: "<<", end: ">>" },
        });

        doc.setData(rowData);

        try {
          doc.render();
        } catch (error) {
          console.error("Error rendering document:", error);
          toast.error(`Failed to generate document for ${name}`);
          continue;
        }

        // Generate a DOCX blob and render to hidden container
        const outputBlob = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.top = "-10000px";
        tempContainer.style.left = "-10000px";
        tempContainer.style.width = "794px"; // ~A4 width @ 96dpi
        tempContainer.style.background = "white";
        document.body.appendChild(tempContainer);

        await renderAsync(outputBlob, tempContainer);

        const fileName = `${name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")}.pdf`;

        await html2pdf()
          .set({
            margin: 10,
            filename: fileName,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(tempContainer)
          .save();

        document.body.removeChild(tempContainer);
      }

      toast.success(`Generated ${selectedCount} PDF(s) successfully!`);
    } catch (error) {
      console.error("Error generating PDFs:", error);
      toast.error("Failed to generate PDFs");
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
          Download PDF(s)
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
