import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import * as XLSX from "xlsx";
import { createExcelTemplate, excelFieldColumns, excelHeaderIndex } from "./excelTemplate";

describe("personalized Excel", () => {
  test("contains only selected headers in row 1, without explanations", () => {
    const workbook = createExcelTemplate(["שם מלא", "תעודת זהות"], "he");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    deepStrictEqual(XLSX.utils.sheet_to_json(sheet, { header: 1 }), [["שם מלא", "תעודת זהות"]]);
  });
  test("automatic date does not need an Excel column", () => {
    deepStrictEqual(excelFieldColumns(["שם מלא", "תאריך נוכחי"]), ["שם מלא"]);
    deepStrictEqual(excelFieldColumns(["תאריך נוכחי"]), []);
  });
  test("header-first files still start at row 1 with more than five records", () => {
    const rows = [["שם מלא", "עיר"], ...Array.from({ length: 10 }, (_, i) => [`אדם ${i}`, "חיפה"])];
    strictEqual(excelHeaderIndex(rows), 0);
  });
  test("older files with five introductory rows still start at row 6", () => {
    strictEqual(excelHeaderIndex([["פרויקט"], [], [], [], [], ["שם מלא", "עיר"], ["דנה", "חיפה"]]), 5);
  });
});