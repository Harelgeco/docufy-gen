import { useState, useEffect } from "react";
import { FileUploader } from "@/components/FileUploader";
import { NameSelector } from "@/components/NameSelector";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ExportOptions } from "@/components/ExportOptions";
import { FieldMapping } from "@/components/FieldMapping";
import { ColumnSelector } from "@/components/ColumnSelector";
import { FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

const Index = () => {
  const [excelFile, setExcelFile] = useState<File>();
  const [wordFile, setWordFile] = useState<File>();
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [wordPlaceholders, setWordPlaceholders] = useState<string[]>([]);
  const [selectedNameColumn, setSelectedNameColumn] = useState<string>("שם מלא רוכש 1");

  useEffect(() => {
    if (excelFile) {
      parseExcelFile(excelFile);
    }
  }, [excelFile]);

  useEffect(() => {
    if (excelData.length > 0 && selectedNameColumn) {
      updateNamesFromColumn(selectedNameColumn);
    }
  }, [selectedNameColumn, excelData]);

  useEffect(() => {
    if (wordFile) {
      parseWordTemplate(wordFile);
    }
  }, [wordFile]);

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
      
      // Skip first 5 rows (project title info), row 6 (index 5) has headers
      const headerRow = jsonData[5] || jsonData[0];

      // Normalize header text: remove line breaks, <br>, extra spaces, NBSP
      const normalize = (val: any) =>
        String(val ?? "")
          .replace(/\u00A0/g, " ")
          .replace(/<br\s*\/?\>/gi, " ")
          .replace(/\r?\n|\r|\t/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      
      const rawHeaders: string[] = (headerRow || []).map((h: any) => normalize(h));

      // Handle duplicate headers by adding suffixes
      const headers: string[] = [];
      const headerCounts: { [key: string]: number } = {};
      rawHeaders.forEach((h) => {
        let key = h;
        if (headerCounts[key]) {
          headerCounts[key]++;
          key = `${key} ${headerCounts[key]}`;
        } else {
          headerCounts[key] = 1;
        }
        headers.push(key);
      });
      
      setExcelHeaders(headers);
      
      // Determine data start row
      const startIndex = jsonData[5] ? 6 : 1;

      // Store all data rows starting from data start
      const dataRows = jsonData.slice(startIndex).map((row: any) => {
        const rowData: any = {};
        headers.forEach((header: string, index: number) => {
          rowData[header] = normalize(row[index]);
        });
        return rowData;
      });
      
      setExcelData(dataRows);
      
      // Set default column if it exists
      if (headers.includes("שם מלא רוכש 1")) {
        setSelectedNameColumn("שם מלא רוכש 1");
      } else if (headers.length > 0) {
        setSelectedNameColumn(headers[0]);
      }
      
      toast.success(`Loaded ${dataRows.length} rows and ${headers.length} columns`);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Failed to parse Excel file");
    }
  };

  const updateNamesFromColumn = (columnName: string) => {
    if (!excelData.length) return;
    
    const extractedNames = excelData
      .map((row: any) => row[columnName])
      .filter((name: string) => name && name.trim() !== "");
    
    setNames(extractedNames);
    setSelectedNames([]);
    toast.success(`Loaded ${extractedNames.length} names from '${columnName}'`);
  };

  const parseWordTemplate = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const zip = new PizZip(data);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Extract all placeholders from the template
      const fullText = doc.getFullText();
      const placeholderRegex = /<<([^>]+)>>/g;
      const matches = fullText.match(placeholderRegex);
      
      if (matches) {
        const placeholders = matches.map((match) => match.replace(/<<|>>/g, ""));
        const uniquePlaceholders = [...new Set(placeholders)];
        setWordPlaceholders(uniquePlaceholders);
        toast.success(`Found ${uniquePlaceholders.length} placeholders in template`);
      } else {
        toast.warning("No placeholders (<<field>>) found in Word template");
      }
    } catch (error) {
      console.error("Error parsing Word template:", error);
      toast.error("Failed to parse Word template");
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

        {/* Column Selection */}
        {excelFile && excelHeaders.length > 0 && (
          <ColumnSelector
            columns={excelHeaders}
            selectedColumn={selectedNameColumn}
            onColumnChange={setSelectedNameColumn}
          />
        )}

        {/* Field Mapping Section */}
        {excelFile && wordFile && excelHeaders.length > 0 && wordPlaceholders.length > 0 && (
          <FieldMapping
            excelHeaders={excelHeaders}
            wordPlaceholders={wordPlaceholders}
          />
        )}

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
                  wordFile={wordFile}
                  excelData={excelData}
                  selectedNames={selectedNames}
                  nameColumn={selectedNameColumn}
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <DocumentPreview
                templateName={wordFile.name}
                selectedName={selectedNames[0]}
                excelData={excelData}
                wordPlaceholders={wordPlaceholders}
                nameColumn={selectedNameColumn}
                wordFile={wordFile}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
