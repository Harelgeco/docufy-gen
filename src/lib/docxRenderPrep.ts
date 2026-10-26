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

// The renderer ignores Word's "flip horizontal" on pictures. Mirror the picture file itself.
const mirrorImage = async (bytes: Uint8Array, mime: string): Promise<Uint8Array | null> => {
  try {
    const bmp = await createImageBitmap(new Blob([bytes], { type: mime }));
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(bmp.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(bmp, 0, 0);
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, mime === "image/jpeg" ? "image/jpeg" : "image/png", 0.95));
    return out ? new Uint8Array(await out.arrayBuffer()) : null;
  } catch {
    return null;
  }
};

const fixFlippedPictures = async (zip: PizZip, part: string, xml: string) => {
  if (!xml.includes('flipH="1"') || typeof document === "undefined") return xml;
  const relsPath = part.replace(/^word\//, "word/_rels/") + ".rels";
  const rels = zip.file(relsPath)?.asText() || "";
  let out = xml;
  const pics = [...xml.matchAll(/<pic:pic\b[\s\S]*?<\/pic:pic>/g)].map((m) => m[0]);
  for (const pic of pics) {
    const embed = pic.match(/<a:blip\b[^>]*r:embed="([^"]+)"/)?.[1];
    if (!embed || !/<a:xfrm\b[^>]*flipH="1"/.test(pic)) continue;
    const target = rels.match(new RegExp(`Id="${embed}"[^>]*Target="([^"]+)"`))?.[1]
      || rels.match(new RegExp(`Target="([^"]+)"[^>]*Id="${embed}"`))?.[1];
    if (!target) continue;
    const mediaPath = "word/" + target.replace(/^\.\//, "");
    const file = zip.file(mediaPath);
    if (!file) continue;
    const mime = /\.jpe?g$/i.test(mediaPath) ? "image/jpeg" : "image/png";
    const flipped = await mirrorImage(file.asUint8Array(), mime);
    if (!flipped) continue;
    zip.file(mediaPath, flipped);
    out = out.replace(pic, pic.replace(/(<a:xfrm\b[^>]*?)\s*flipH="1"/, "$1"));
  }
  return out;
};

export const prepareDocxForRender = async (blob: Blob): Promise<Blob> => {
  try {
    const zip = new PizZip(await blob.arrayBuffer());
    Object.keys(zip.files)
      .filter((n) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n))
    const parts = Object.keys(zip.files).filter((n) =>
      /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n)
    );
    for (const n of parts) {
      const xml = zip.file(n)?.asText();
      if (!xml) continue;
      const fixed = await fixFlippedPictures(zip, n, xml);
      zip.file(n, fixRtlTables(showPictureFills(unwrapSdt(fixed))));
    }
    return zip.generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch {
    return blob;
  }
};
