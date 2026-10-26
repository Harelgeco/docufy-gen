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

export const prepareDocxForRender = async (blob: Blob): Promise<Blob> => {
  try {
    const zip = new PizZip(await blob.arrayBuffer());
    Object.keys(zip.files)
      .filter((n) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n))
      .forEach((n) => {
        const xml = zip.file(n)?.asText();
        if (xml) zip.file(n, showPictureFills(unwrapSdt(xml)));
      });
    return zip.generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch {
    return blob;
  }
};
