import PizZip from "pizzip";

/**
 * Turns a finished Word document into a <<field>> template by replacing
 * text the user selected. Only the touched <w:t> text nodes change; every
 * other byte of the document (styles, tables, images, layout) is kept.
 *
 * Security (OWASP XXE): any XML part that declares a DOCTYPE or ENTITY is
 * rejected before parsing, so no entity can ever be expanded or resolved.
 * Size limits guard against zip bombs.
 */

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_PART_CHARS = 30 * 1024 * 1024;
const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const PART_RE = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;

export class UnsafeDocumentError extends Error {}

export interface BuilderParagraph {
  id: string; // `${part}#${index}`
  part: string;
  index: number;
  text: string;
  align: "right" | "left" | "center" | "justify" | "start";
  bold: boolean;
  location: "body" | "header" | "footer" | "note";
}

export interface TemplateSession {
  zip: PizZip;
  docs: Map<string, Document>;
  fileName: string;
}

export function assertSafeXml(xml: string, name: string) {
  if (xml.length > MAX_PART_CHARS) throw new UnsafeDocumentError(`${name} too large`);
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) {
    throw new UnsafeDocumentError(`${name} contains DOCTYPE/ENTITY declarations`);
  }
}

function parseSafe(xml: string, name: string): Document {
  assertSafeXml(xml, name);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new UnsafeDocumentError(`${name} is not valid XML`);
  }
  return doc;
}

export async function openTemplateSession(file: File): Promise<TemplateSession> {
  if (file.size > MAX_FILE_BYTES) throw new UnsafeDocumentError("file too large");
  const zip = new PizZip(await file.arrayBuffer());
  const docs = new Map<string, Document>();
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith(".xml") && !name.endsWith(".rels")) continue;
    const xml = zip.file(name)?.asText() ?? "";
    assertSafeXml(xml, name); // scan every XML part, not only the ones we edit
    if (PART_RE.test(name)) docs.set(name, parseSafe(xml, name));
  }
  if (!docs.has("word/document.xml")) throw new UnsafeDocumentError("not a Word document");
  return { zip, docs, fileName: file.name };
}

const textNodes = (p: Element) =>
  Array.from(p.getElementsByTagNameNS(W_NS, "t")).filter(
    (t) => t.closest ? closestP(t) === p : true
  );

function closestP(el: Element): Element | null {
  let n: Element | null = el.parentElement;
  while (n && !(n.namespaceURI === W_NS && n.localName === "p")) n = n.parentElement;
  return n;
}

const paragraphsOf = (doc: Document) => Array.from(doc.getElementsByTagNameNS(W_NS, "p"));

function locationOf(part: string): BuilderParagraph["location"] {
  if (part.includes("header")) return "header";
  if (part.includes("footer")) return "footer";
  if (part.includes("notes")) return "note";
  return "body";
}

export function listParagraphs(s: TemplateSession): BuilderParagraph[] {
  const out: BuilderParagraph[] = [];
  const order = [...s.docs.keys()].sort((a, b) => rank(a) - rank(b));
  for (const part of order) {
    paragraphsOf(s.docs.get(part)!).forEach((p, index) => {
      const text = textNodes(p).map((t) => t.textContent ?? "").join("");
      const jc = p.getElementsByTagNameNS(W_NS, "jc")[0]?.getAttributeNS(W_NS, "val") ?? "";
      const align =
        jc === "center" ? "center" : jc === "both" ? "justify" : jc === "right" ? "right" : jc === "left" ? "left" : "start";
      const bold = p.getElementsByTagNameNS(W_NS, "b").length > 0;
      out.push({ id: `${part}#${index}`, part, index, text, align, bold, location: locationOf(part) });
    });
  }
  return out;
}

function rank(part: string) {
  if (part.includes("header")) return 0;
  if (part === "word/document.xml") return 1;
  if (part.includes("footer")) return 2;
  return 3;
}

/** Replace characters [start, end) of a paragraph's text with `replacement`. */
export function replaceInParagraph(
  s: TemplateSession,
  part: string,
  index: number,
  start: number,
  end: number,
  replacement: string
) {
  const p = paragraphsOf(s.docs.get(part)!)[index];
  if (!p || end <= start) return;
  let pos = 0;
  let inserted = false;
  for (const t of textNodes(p)) {
    const txt = t.textContent ?? "";
    const a = pos, b = pos + txt.length;
    pos = b;
    if (b <= start || a >= end) continue;
    const from = Math.max(start, a) - a;
    const to = Math.min(end, b) - a;
    const keep = inserted ? "" : replacement;
    inserted = true;
    t.textContent = txt.slice(0, from) + keep + txt.slice(to);
    t.setAttribute("xml:space", "preserve");
  }
}

/** All occurrences of `needle` across the document: [{part,index,start}] */
export function findOccurrences(s: TemplateSession, needle: string) {
  const res: { part: string; index: number; start: number }[] = [];
  if (!needle) return res;
  for (const para of listParagraphs(s)) {
    let i = para.text.indexOf(needle);
    while (i !== -1) {
      res.push({ part: para.part, index: para.index, start: i });
      i = para.text.indexOf(needle, i + needle.length);
    }
  }
  return res;
}

export function replaceAll(s: TemplateSession, needle: string, replacement: string) {
  // Go backwards within each paragraph so earlier offsets stay valid.
  const occ = findOccurrences(s, needle).reverse();
  for (const o of occ) replaceInParagraph(s, o.part, o.index, o.start, o.start + needle.length, replacement);
  return occ.length;
}

/** Validates a field label. Returns cleaned name or null. */
export function cleanFieldName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name || name.length > 60) return null;
  if (/[<>{}&"\\/]/.test(name)) return null;
  return name;
}

export function buildFile(s: TemplateSession): File {
  const ser = new XMLSerializer();
  for (const [part, doc] of s.docs) s.zip.file(part, ser.serializeToString(doc));
  const blob = s.zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }) as Blob;
  const base = s.fileName.replace(/\.docx?$/i, "");
  return new File([blob], `${base}-תבנית.docx`, { type: blob.type });
}

export async function hasPlaceholders(file: File): Promise<boolean> {
  const zip = new PizZip(await file.arrayBuffer());
  for (const name of Object.keys(zip.files)) {
    if (!PART_RE.test(name)) continue;
    const xml = (zip.file(name)?.asText() ?? "").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    if (/<<[^<>]+>>/.test(xml)) return true;
  }
  return false;
}
