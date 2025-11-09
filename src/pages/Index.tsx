import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { NameSelector } from "@/components/NameSelector";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ExportOptions } from "@/components/ExportOptions";
import { FileText } from "lucide-react";

const Index = () => {
  const [excelFile, setExcelFile] = useState<File>();
  const [wordFile, setWordFile] = useState<File>();
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  // Mock data for demonstration
  const mockNames = [
    "John Smith",
    "Sarah Johnson",
    "Michael Brown",
    "Emily Davis",
    "David Wilson",
    "Lisa Anderson",
    "James Taylor",
    "Jennifer Martinez",
  ];

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
                names={mockNames}
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
