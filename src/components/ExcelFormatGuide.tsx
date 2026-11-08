import { useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, HelpCircle } from "lucide-react";

const SAMPLE = ["שם מלא", "תעודת זהות", "תאריך"];
const SAMPLE_ROWS = [["ישראל ישראלי", "012345678", "01.01.2026"], ["דנה כהן", "087654321", "02.01.2026"]];
const AUTO = "תאריך נוכחי";

/** Builds an Excel matching the app's parser: rows 1-5 free, row 6 headers, data from row 7. */
export function downloadExcelTemplate(fields: string[], language: "he" | "en") {
  const cols = fields.filter((f) => f !== AUTO);
  const note = language === "he"
    ? ["שורות 1-5 פנויות לפרטים כלליים. אל תשנו את הכותרות בשורה 6, ומלאו נתונים משורה 7."]
    : ["Rows 1-5 are free for notes. Keep the headers in row 6 and fill data from row 7."];
  const ws = XLSX.utils.aoa_to_sheet([note, [], [], [], [], cols]);
  ws["!cols"] = cols.map((c) => ({ wch: Math.max(14, c.length + 4) }));
  const wb = XLSX.utils.book_new();
  if (language === "he") wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(wb, ws, "נתונים");
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
  const he = language === "he";
  const cols = fields.filter((f) => f !== AUTO);
  const has = cols.length > 0;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
      >
        <HelpCircle className="h-4 w-4" />
        {he ? "באיזה מבנה להעלות את האקסל?" : "How should the Excel look?"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" dir={he ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{he ? "איך להכין את קובץ האקסל" : "Preparing your Excel file"}</DialogTitle>
            <DialogDescription>
              {he
                ? "כל עמודה באקסל היא שדה בתבנית. הכותרת של העמודה צריכה להיות בדיוק שם השדה, בלי ה־<< >>."
                : "Each column is a template field. The column header must be exactly the field name, without << >>."}
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc ps-5 text-sm space-y-1 text-foreground">
            <li>{he ? "שורות 1–5: פנויות לפרטים כלליים (לא נקראות)." : "Rows 1–5: free for notes (ignored)."}</li>
            <li>{he ? "שורה 6: כותרות העמודות = שמות השדות." : "Row 6: column headers = field names."}</li>
            <li>{he ? "משורה 7 והלאה: שורה אחת לכל מסמך." : "Row 7 onward: one row per document."}</li>
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
