import { useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, HelpCircle } from "lucide-react";
import { createExcelTemplate, excelFieldColumns } from "@/lib/excelTemplate";

const SAMPLE = ["שם מלא", "תעודת זהות", "תאריך"];
const SAMPLE_ROWS = [["ישראל ישראלי", "012345678", "01.01.2026"], ["דנה כהן", "087654321", "02.01.2026"]];
const AUTO = "תאריך נוכחי";

/** Download only the personalized table, starting with its headers. */
export function downloadExcelTemplate(fields: string[], language: "he" | "en") {
  if (!excelFieldColumns(fields).length) return;
  const wb = createExcelTemplate(fields, language);
  XLSX.writeFile(wb, language === "he" ? "אקסל-לתבנית.xlsx" : "excel-template.xlsx");
}

export function ExampleTable({ headers, rows }: { headers: string[]; rows?: string[][] }) {
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-primary text-primary-foreground">
          <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-start font-semibold whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody>
          {(rows ?? [headers.map(() => "…")]).map((r, i) => (
            <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="px-3 py-2 text-muted-foreground whitespace-nowrap">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExcelFormatGuide({ fields, language }: { fields: string[]; language: "he" | "en" }) {
  const [open, setOpen] = useState(false);
  const [personalized, setPersonalized] = useState(false);
  const he = language === "he";
  const cols = excelFieldColumns(fields);
  const has = cols.length > 0;
  return (
    <>
      <Button
        type="button"
        variant="link"
        onClick={() => { setPersonalized(false); setOpen(true); }}
        className="mt-2 h-auto w-full whitespace-normal"
      >
        <HelpCircle className="h-4 w-4" />
        {he ? "באיזה מבנה להעלות את האקסל?" : "How should the Excel look?"}
      </Button>
      {has && (
        <Button
          type="button"
          variant="link"
          onClick={() => { setPersonalized(true); setOpen(true); }}
          className="h-auto w-full whitespace-normal"
        >
          <Download className="h-4 w-4" />
          {he ? "הורד אקסל מוכן לשדות התבנית" : "Download a ready Excel for your fields"}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" dir={he ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{personalized ? (he ? "האקסל המותאם שלכם" : "Your personalized Excel") : (he ? "איך להכין את קובץ האקסל" : "Preparing your Excel file")}</DialogTitle>
            <DialogDescription>
              {personalized && has
                ? (he ? "הטבלה מותאמת אישית לשדות שבחרתם במסמך. הכותרות כבר מוכנות — הורידו את הקובץ ומלאו את הפרטים מתחת לכל כותרת." : "This table is personalized to the fields you selected in your document. The headers are ready — download the file and fill in the details below each header.")
                : he
                ? "כל עמודה באקסל היא שדה בתבנית. הכותרת של העמודה צריכה להיות בדיוק שם השדה, בלי ה־<< >>."
                : "Each column is a template field. The column header must be exactly the field name, without << >>."}
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc ps-5 text-sm space-y-1 text-foreground">
            <li>{he ? "שורה 1: כותרות העמודות = שמות השדות." : "Row 1: column headers = field names."}</li>
            <li>{he ? "משורה 2 והלאה: שורה אחת לכל מסמך." : "Row 2 onward: one row per document."}</li>
            {fields.includes(AUTO) && <li>{he ? "\"תאריך נוכחי\" ממולא אוטומטית — אין צורך בעמודה." : "\"תאריך נוכחי\" fills automatically — no column needed."}</li>}
          </ul>
          <p className="text-sm font-medium">
            {has ? (he ? "לפי התבנית שלכם:" : "Based on your template:") : (he ? "דוגמה:" : "Example:")}
          </p>
          <ExampleTable headers={has ? cols : SAMPLE} rows={has ? undefined : SAMPLE_ROWS} />
          {has ? (
            <Button onClick={() => downloadExcelTemplate(fields, language)}>
              <Download className="h-4 w-4" />
              {he ? "הורד קובץ אקסל מוכן לתבנית זו" : "Download a ready Excel for this template"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {he ? "העלו תבנית וורד כדי לקבל קובץ אקסל מוכן עם השדות שלכם." : "Upload a Word template to get a ready Excel with your fields."}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
