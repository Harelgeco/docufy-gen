import PizZip from "pizzip";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const para = (text: string, opts: { bold?: boolean; size?: number; center?: boolean } = {}) =>
  `<w:p><w:pPr><w:bidi/>${opts.center ? '<w:jc w:val="center"/>' : ""}<w:spacing w:after="200"/></w:pPr>` +
  `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${opts.bold ? "<w:b/><w:bCs/>" : ""}` +
  `<w:sz w:val="${opts.size ?? 24}"/><w:szCs w:val="${opts.size ?? 24}"/><w:rtl/></w:rPr>` +
  `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;

/** Builds a small finished Hebrew Word letter so visitors can try field marking without their own file. */
export function createSampleDocx(): File {
  const body = [
    para("08/11/2026", {}),
    para("לכבוד: ישראל ישראלי", { bold: true }),
    para("אישור השתתפות בקורס", { bold: true, size: 32, center: true }),
    para("הרינו לאשר כי ישראל ישראלי, תעודת זהות 123456789, השתתף בקורס ניהול פרויקטים והשלים אותו בהצלחה."),
    para("הקורס התקיים בעיר תל אביב והסתיים בציון 95."),
    para("בברכה,"),
    para("מחלקת הדרכה"),
  ].join("");

  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:bidi/></w:sectPr></w:body></w:document>`,
  );
  const blob = zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return new File([blob], "מכתב_לדוגמה.docx", { type: blob.type });
}
