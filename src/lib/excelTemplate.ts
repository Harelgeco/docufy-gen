import * as XLSX from "xlsx";

export function excelFieldColumns(fields: string[]) {
  return [...new Set(fields.map((field) => field.trim()).filter((field) => field && field !== "תאריך נוכחי"))];
}

export function createExcelTemplate(fields: string[], language: "he" | "en") {
  const columns = excelFieldColumns(fields);
  const sheet = XLSX.utils.aoa_to_sheet([columns]);
  sheet["!cols"] = columns.map((column) => ({ wch: Math.max(14, column.length + 4) }));
  const workbook = XLSX.utils.book_new();
  if (language === "he") workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, sheet, language === "he" ? "נתונים" : "Data");
  return workbook;
}

/** Keep older title-prefixed files working, without mistaking the sixth data row for headers. */
export function excelHeaderIndex(rows: unknown[][]) {
  const count = (row: unknown[] = []) => row.filter((value) => String(value ?? "").trim()).length;
  const sixth = count(rows[5]);
  return sixth > 1 && rows.slice(0, 5).every((row) => count(row) < sixth) ? 5 : 0;
}