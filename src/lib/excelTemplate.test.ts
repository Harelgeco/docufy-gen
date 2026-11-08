import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { createExcelTemplate, excelFieldColumns, excelHeaderIndex } from "./excelTemplate";

describe("personalized Excel", () => {
  test("contains only selected headers in row 1, without explanations", () => {
    const workbook = createExcelTemplate(["שם מלא", "תעודת זהות"], "he");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(XLSX.utils.sheet_to_json(sheet, { header: 1 })).toEqual([["שם מלא", "תעודת זהות"]]);
  });
  test("automatic date does not need an Excel column", () => {
    expect(excelFieldColumns(["שם מלא", "תאריך נוכחי"])).toEqual(["שם מלא"]);
    expect(excelFieldColumns(["תאריך נוכחי"])).toEqual([]);
  });
  test("header-first files still start at row 1 with more than five records", () => {
    const rows = [["שם מלא", "עיר"], ...Array.from({ length: 10 }, (_, i) => [`אדם ${i}`, "חיפה"])];
    expect(excelHeaderIndex(rows)).toBe(0);
  });
  test("older files with five introductory rows still start at row 6", () => {
    expect(excelHeaderIndex([["פרויקט"], [], [], [], [], ["שם מלא", "עיר"], ["דנה", "חיפה"]])).toBe(5);
  });
});