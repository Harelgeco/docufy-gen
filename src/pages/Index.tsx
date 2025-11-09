import { useState, useEffect } from "react";
import { FileUploader } from "@/components/FileUploader";
import { NameSelector } from "@/components/NameSelector";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ExportOptions } from "@/components/ExportOptions";
import { FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const Index = () => {
  const [excelFile, setExcelFile] = useState<File>();
  const [wordFile, setWordFile] = useState<File>();
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    if (excelFile) {
      parseExcelFile(excelFile);
    }
  }, [excelFile]);

  const parseExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      // Use the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
      
      if (jsonData.length === 0) {
        toast.error("No data found in Excel file");
        return;
      }
      
      // Find the column index for "שם מלא רוכש 1"
      const headerRow = jsonData[0];
      const nameColumnIndex = headerRow.findIndex((header: any) => 
        String(header).trim() === "שם מלא רוכש 1"
      );
      
      if (nameColumnIndex === -1) {
        toast.error("Column 'שם מלא רוכש 1' not found in the table");
        return;
      }
      
      // Extract names from the specific column, skipping header, convert to strings
      const extractedNames = jsonData
        .slice(1)
        .map((row: any) => row[nameColumnIndex])
        .filter((name: any) => name && String(name).trim() !== "")
        .map((name: any) => String(name));
      
      setNames(extractedNames);
      toast.success(`Loaded ${extractedNames.length} names from 'שם מלא רוכש 1' column`);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Failed to parse Excel file");
    }
  };

  const handleNameSelection = (name: string, checked: boolean) => {
    if (checked) {
      setSelectedNames([...selectedNames, name]);
    } else {
      setSelectedNames(selectedNames.filter((n) => n !== name));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Document Generator
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Generate Custom Documents in Seconds
          </h2>
          <p className="text-lg text-muted-foreground">
            Upload your Excel data and Word template, select names, and create
            personalized PDF documents with ease.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <FileUploader
            title="Upload Excel File"
            description="Drag and drop or click to select your data file"
            accept=".xlsx,.xls"
            onFileSelect={setExcelFile}
            selectedFile={excelFile}
          />
          <FileUploader
            title="Upload Word Template"
            description="Drag and drop or click to select your template"
            accept=".docx,.doc"
            onFileSelect={setWordFile}
            selectedFile={wordFile}
          />
        </div>

        {/* Processing Section */}
        {excelFile && wordFile && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <NameSelector
                names={names}
                selectedNames={selectedNames}
                onSelectionChange={handleNameSelection}
              />
              <div className="mt-6">
                <ExportOptions
                  disabled={selectedNames.length === 0}
                  selectedCount={selectedNames.length}
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <DocumentPreview
                templateName={wordFile.name}
                selectedName={selectedNames[0]}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
