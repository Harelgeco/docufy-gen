import { useEffect, useRef, useState, Fragment } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ArrowLeft, Tag, Undo2, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExampleTable, downloadExcelTemplate } from "@/components/ExcelFormatGuide";
import { toast } from "sonner";
import {
  openTemplateSession, listParagraphs, replaceInParagraph, replaceAll, findOccurrences,
  cleanFieldName, buildFile, TemplateSession, BuilderParagraph, UnsafeDocumentError,
} from "@/lib/templateBuilder";

interface Props {
  file?: File;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onComplete: (file: File) => void;
  language: "he" | "en";
}

interface Pending { pid: string; part: string; index: number; start: number; end: number; text: string; x: number; y: number }

const T = {
  he: {
    title: "הפיכת מסמך לתבנית",
    desc: "סמנו בעכבר טקסט שמשתנה בין מסמך למסמך (למשל שם), ותנו לו שם שדה.",
    fieldName: "שם השדה (למשל: שם פרטי)",
    replace: "הפוך לשדה",
    onlyHere: "רק כאן",
    all: (n: number) => `כל ${n} המופעים`,
    fields: "שדות שנוצרו",
    none: "עדיין לא נוצרו שדות",
    continue: "המשך להפקת מסמכים",
    download: "הורד תבנית Word",
    undo: "בטל אחרון",
    bad: "שם שדה לא תקין (עד 60 תווים, בלי < > { } & \" / \\)",
    oneLine: "יש לסמן טקסט בתוך שורה אחת",
    unsafe: "הקובץ נחסם: מבנה לא בטוח או לא נתמך",
    header: "כותרת עליונה", footer: "כותרת תחתונה",
    dateSuggest: "זה התאריך של היום? לחצו כאן כדי שימולא אוטומטית בכל הנפקה (תאריך נוכחי)",
    dateTip: "טיפ: סמנו את תאריך המסמך וקראו לשדה \"תאריך נוכחי\" — התאריך של היום ימולא אוטומטית.",
  },
  en: {
    title: "Turn document into a template",
    desc: "Select text that changes between documents (e.g. a name) and give it a field name.",
    fieldName: "Field name (e.g. First name)",
    replace: "Make field",
    onlyHere: "Only here",
    all: (n: number) => `All ${n} occurrences`,
    fields: "Created fields",
    none: "No fields yet",
    continue: "Continue to generate",
    download: "Download Word template",
    undo: "Undo last",
    bad: "Invalid field name (max 60 chars, no < > { } & \" / \\)",
    oneLine: "Select text within a single line",
    unsafe: "File blocked: unsafe or unsupported structure",
    header: "Header", footer: "Footer",
    dateSuggest: "Is this today's date? Click to fill it automatically on every export (תאריך נוכחי)",
    dateTip: "Tip: select the document date and name the field \"תאריך נוכחי\" — today's date fills in automatically.",
  },
};

const CURRENT_DATE = "תאריך נוכחי";
const HE_MONTHS = "ינואר|פברואר|מרץ|מרס|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר";
const looksLikeDate = (s: string) =>
  /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/.test(s) ||
  /\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b/.test(s) ||
  new RegExp(`(${HE_MONTHS})`).test(s) ||
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(s);

export function TemplateBuilder({ file, open, onOpenChange, onComplete, language }: Props) {
  const t = T[language];
  const [session, setSession] = useState<TemplateSession>();
  const [paras, setParas] = useState<BuilderParagraph[]>([]);
  const [pending, setPending] = useState<Pending>();
  const [name, setName] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const history = useRef<ArrayBuffer[]>([]);
  const fileRef = useRef<File>();
  const paperRef = useRef<HTMLDivElement>(null);

  const load = async (f: File) => {
    try {
      const s = await openTemplateSession(f);
      setSession(s);
      setParas(listParagraphs(s));
      const existing = [...new Set(listParagraphs(s).flatMap((p) => [...p.text.matchAll(/<<([^<>]+)>>/g)].map((m) => m[1])))];
      setFields(existing);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof UnsafeDocumentError ? t.unsafe : t.unsafe);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open && file && fileRef.current !== file) {
      fileRef.current = file;
      history.current = [];
      setPending(undefined);
      load(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file]);

  const onMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const el = (n: Node | null) => (n instanceof Element ? n : n?.parentElement)?.closest("[data-pid]") as HTMLElement | null;
    const a = el(range.startContainer), b = el(range.endContainer);
    if (!a || a !== b) { toast.info(t.oneLine); return; }
    const pre = document.createRange();
    pre.selectNodeContents(a);
    pre.setEnd(range.startContainer, range.startOffset);
    let start = pre.toString().length;
    let text = range.toString();
    // Trim surrounding spaces from the selection
    const lead = text.length - text.trimStart().length;
    start += lead;
    text = text.trim();
    if (!text) return;
    const para = paras.find((p) => p.id === a.dataset.pid)!;
    const rect = range.getBoundingClientRect();
    const box = paperRef.current!.getBoundingClientRect();
    setPending({
      pid: para.id, part: para.part, index: para.index, start, end: start + text.length, text,
      x: rect.left - box.left + rect.width / 2, y: rect.bottom - box.top + paperRef.current!.scrollTop + 6,
    });
    setName("");
  };

  const snapshot = () => {
    if (!session) return;
    const ser = new XMLSerializer();
    const z = session.zip;
    for (const [part, doc] of session.docs) z.file(part, ser.serializeToString(doc));
    history.current.push(z.generate({ type: "arraybuffer" }) as ArrayBuffer);
  };

  const apply = (all: boolean) => {
    if (!session || !pending) return;
    const clean = cleanFieldName(name);
    if (!clean) { toast.error(t.bad); return; }
    snapshot();
    const tag = `<<${clean}>>`;
    if (all) replaceAll(session, pending.text, tag);
    else replaceInParagraph(session, pending.part, pending.index, pending.start, pending.end, tag);
    setParas(listParagraphs(session));
    setFields((f) => (f.includes(clean) ? f : [...f, clean]));
    setPending(undefined);
    window.getSelection()?.removeAllRanges();
  };

  const undo = async () => {
    const buf = history.current.pop();
    if (!buf || !session) return;
    const s = await openTemplateSession(new File([buf], session.fileName));
    setSession(s);
    const ps = listParagraphs(s);
    setParas(ps);
    setFields([...new Set(ps.flatMap((p) => [...p.text.matchAll(/<<([^<>]+)>>/g)].map((m) => m[1])))]);
  };

  const download = () => {
    if (!session) return;
    const f = buildFile(session);
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url; a.download = f.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const finish = () => {
    if (!session) return;
    const f = buildFile(session);
    fileRef.current = f;
    onComplete(f);
    onOpenChange(false);
  };

  // Closing keeps the work: the edited document replaces the uploaded file,
  // so reopening the editor continues from where the user stopped.
  const close = (o: boolean) => {
    if (o) return onOpenChange(true);
    setPending(undefined);
    if (session && history.current.length) {
      const f = buildFile(session);
      fileRef.current = f;
      onComplete(f);
    }
    onOpenChange(false);
  };

  const occurrences = pending && session ? findOccurrences(session, pending.text).length : 0;

  const renderText = (text: string) =>
    text.split(/(<<[^<>]+>>)/g).map((chunk, i) =>
      /^<<[^<>]+>>$/.test(chunk) ? (
        <span key={i} className="rounded bg-accent px-1 font-semibold text-primary ring-1 ring-ring/40">{chunk}</span>
      ) : (
        <Fragment key={i}>{chunk}</Fragment>
      )
    );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="max-w-6xl h-[90vh] flex flex-col gap-3"
        dir={language === "he" ? "rtl" : "ltr"}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          setPending(undefined);
          window.getSelection()?.removeAllRanges();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.desc}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 grid md:grid-cols-[1fr_260px] gap-4">
          <div ref={paperRef} className="relative overflow-auto rounded-md bg-muted p-4" onMouseUp={onMouseUp}>
            <div className="mx-auto max-w-[800px] min-h-full bg-card shadow-sm px-10 py-12 text-foreground" dir="auto">
              {paras.map((p) =>
                p.text.trim() === "" ? <div key={p.id} className="h-3" /> : (
                  <p
                    key={p.id}
                    data-pid={p.id}
                    dir="auto"
                    className={`mb-2 leading-relaxed selection:bg-ring/30 ${p.bold ? "font-semibold" : ""} ${p.location !== "body" ? "text-sm text-muted-foreground" : ""}`}
                    style={{ textAlign: p.align }}
                  >
                    {renderText(p.text)}
                  </p>
                )
              )}
            </div>
            {pending && (
              <div
                className="absolute z-10 w-72 -translate-x-1/2 rounded-md border bg-popover p-3 shadow-lg space-y-2"
                style={{ left: Math.max(150, pending.x), top: pending.y }}
                onMouseUp={(e) => e.stopPropagation()}
              >
                <div className="text-xs text-muted-foreground truncate">“{pending.text}”</div>
                <Input
                  autoFocus
                  value={name}
                  maxLength={60}
                  placeholder={t.fieldName}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") apply(false); if (e.key === "Escape") setPending(undefined); }}
                />
                {looksLikeDate(pending.text) && name !== CURRENT_DATE && (
                  <button
                    type="button"
                    className="w-full rounded border border-ring/40 bg-accent p-2 text-start text-xs text-primary hover:bg-accent/70"
                    onClick={() => setName(CURRENT_DATE)}
                  >
                    {t.dateSuggest}
                  </button>
                )}
                {occurrences > 1 ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => apply(false)}>{t.onlyHere}</Button>
                    <Button size="sm" className="flex-1" onClick={() => apply(true)}>{t.all(occurrences)}</Button>
                  </div>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => apply(false)}><Tag className="h-4 w-4" />{t.replace}</Button>
                )}
              </div>
            )}
          </div>
          <aside className="flex flex-col gap-3 min-h-0">
            <h4 className="font-semibold">{t.fields} ({fields.length})</h4>
            <div className="flex-1 overflow-auto space-y-1">
              {fields.length === 0 && <p className="text-sm text-muted-foreground">{t.none}</p>}
              {fields.map((f) => (
                <div key={f} className="rounded border bg-accent px-2 py-1 text-sm text-primary">&lt;&lt;{f}&gt;&gt;</div>
              ))}
            </div>
            <div className="flex items-start gap-1 rounded border border-ring/40 bg-accent p-2 text-xs text-primary">
              <span className="flex-1">💡 {language === "he" ? "שמות השדות יהיו הכותרות של העמודות בקובץ האקסל." : "Field names become the column headers in your Excel file."}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label={language === "he" ? "הצג דוגמה" : "Show example"} className="shrink-0 rounded-full hover:text-ring"><HelpCircle className="h-4 w-4" /></button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-2" dir={language === "he" ? "rtl" : "ltr"}>
                  <p className="text-xs font-medium">{language === "he" ? "במסמך הוורד:" : "In the Word document:"}</p>
                  <p className="rounded border bg-card p-2 text-sm">{language === "he" ? "ברכות " : "Greetings "}<span className="rounded bg-accent px-1 font-semibold text-primary">&lt;&lt;{(fields[0] ?? (language === "he" ? "שם מלא" : "Full name"))}&gt;&gt;</span></p>
                  <p className="text-xs font-medium">{language === "he" ? "בקובץ האקסל (כותרת העמודה):" : "In the Excel file (column header):"}</p>
                  <ExampleTable headers={[fields[0] ?? (language === "he" ? "שם מלא" : "Full name")]} rows={[[language === "he" ? "ישראל ישראלי" : "Jane Doe"], [language === "he" ? "דנה כהן" : "John Smith"]]} />
                </PopoverContent>
              </Popover>
            </div>
            <p className="rounded border border-ring/40 bg-accent p-2 text-xs text-primary">💡 {t.dateTip}</p>
            <Button variant="ghost" size="sm" onClick={undo} disabled={!history.current.length}><Undo2 className="h-4 w-4" />{t.undo}</Button>
            <Button variant="outline" onClick={download} disabled={!fields.length}><Download className="h-4 w-4" />{t.download}</Button>
            <Button variant="outline" onClick={() => downloadExcelTemplate(fields, language)} disabled={!fields.length}><Download className="h-4 w-4" />{language === "he" ? "הורד אקסל מוכן לשדות" : "Download matching Excel"}</Button>
            <Button size="lg" onClick={finish} disabled={!fields.length}>{t.continue}<ArrowLeft className={`h-4 w-4 ${language === "en" ? "rotate-180" : ""}`} /></Button>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
