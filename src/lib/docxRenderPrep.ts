import PizZip from "pizzip";

// Prepares a filled DOCX for on-screen/PDF rendering only (never for the Word download).
// The browser renderer drops content inside Word "content controls" (w:sdt),
// so we unwrap them: their inner content stays exactly as-is.
const unwrapSdt = (xml: string) => {
  let prev = "";
  let out = xml;
  // Repeat to handle nested controls (innermost first)
  while (out !== prev) {
    prev = out;
    out = out.replace(
      /<w:sdt>(?:(?!<w:sdt>)[\s\S])*?<w:sdtContent>((?:(?!<w:sdt>)[\s\S])*?)<\/w:sdtContent>\s*<\/w:sdt>/g,
      "$1"
    );
  }
  return out;
};

// The renderer ignores pictures used as a shape "fill" (e.g. a photo inside a circle).
// Show that picture as the shape's image, clipped to a circle for ovals.
const showPictureFills = (xml: string) =>
  xml.replace(/<v:(oval|rect|roundrect|shape)\b([^>]*)>([\s\S]*?)<\/v:\1>/g, (all, tag, attrs, inner) => {
    const fill = inner.match(/<v:fill\b[^>]*\br:id="([^"]+)"[^>]*\/>/);
    if (!fill || inner.includes("<v:imagedata")) return all;
    let a = attrs;
    if (tag === "oval") {
      a = /style="/.test(a)
        ? a.replace(/style="/, 'style="border-radius:50%;overflow:hidden;')
        : a + ' style="border-radius:50%;overflow:hidden"';
    }
    return `<v:${tag}${a}>${inner}<v:imagedata r:id="${fill[1]}" o:title=""/></v:${tag}>`;
  });

// Right-to-left tables (Word "bidiVisual") are drawn left-to-right by the renderer,
// which mirrors the layout. Reverse the column order so it matches Word.
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const fixRtlTables = (xml: string) => {
  if (!xml.includes("w:bidiVisual") || typeof DOMParser === "undefined") return xml;
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return xml;
  const kids = (el: Element, name: string) =>
    Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1 && (n as Element).localName === name && (n as Element).namespaceURI === W);
  Array.from(doc.getElementsByTagNameNS(W, "tbl")).forEach((tbl) => {
    const pr = kids(tbl, "tblPr")[0];
    const flag = pr && kids(pr, "bidiVisual")[0];
    if (!flag) return;
    pr.removeChild(flag);
    const grid = kids(tbl, "tblGrid")[0];
    if (grid) kids(grid, "gridCol").reverse().forEach((c) => grid.appendChild(c));
    kids(tbl, "tr").forEach((tr) => {
      const cells = kids(tr, "tc");
      const after = cells[cells.length - 1]?.nextSibling ?? null;
      cells.reverse().forEach((c) => tr.insertBefore(c, after));
    });
  });
  return new XMLSerializer().serializeToString(doc);
};

export const prepareDocxForRender = async (blob: Blob): Promise<Blob> => {
  try {
    const zip = new PizZip(await blob.arrayBuffer());
    Object.keys(zip.files)
      .filter((n) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n))
      .forEach((n) => {
        const xml = zip.file(n)?.asText();
        if (xml) zip.file(n, fixRtlTables(showPictureFills(unwrapSdt(xml))));
      });
    return zip.generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch {
    return blob;
  }
};
