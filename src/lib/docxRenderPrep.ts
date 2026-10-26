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

export const prepareDocxForRender = async (blob: Blob): Promise<Blob> => {
  try {
    const zip = new PizZip(await blob.arrayBuffer());
    Object.keys(zip.files)
      .filter((n) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n))
      .forEach((n) => {
        const xml = zip.file(n)?.asText();
        if (xml && xml.includes("<w:sdt>")) zip.file(n, unwrapSdt(xml));
      });
    return zip.generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch {
    return blob;
  }
};
