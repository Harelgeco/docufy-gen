import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, FileText, Pause, Play, RotateCcw, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const samples = [
  { name: "דנה לוי", id: "123456782", address: "הרצל 12, תל אביב", apartment: "14", date: "27/10/2026", project: "גני העיר", floor: "3", parking: "22", amount: "4,500 ₪", notes: "חתימה במעמד המסירה" },
  { name: "אורי כהן", id: "234567893", address: "הנשיא 8, חיפה", apartment: "21", date: "28/10/2026", project: "גני העיר", floor: "5", parking: "34", amount: "5,200 ₪", notes: "תיאום מראש" },
  { name: "מיה ישראלי", id: "345678904", address: "הדקל 5, רעננה", apartment: "8", date: "29/10/2026", project: "גני העיר", floor: "2", parking: "16", amount: "4,800 ₪", notes: "עותק נוסף ללקוחה" },
];
const labels = ["שם מלא", "מספר זהות", "כתובת", "מספר דירה", "תאריך", "פרויקט", "קומה", "חניה", "סכום", "הערות"];
const stages = ["תבנית אחת", "הנתונים שלכם", "30 מסמכים אישיים"];

export const AutomationDemo = ({ compact = false }: { compact?: boolean }) => {
  const reducedMotion = useReducedMotion();
  const demoRef = useRef<HTMLDivElement>(null);
  const visible = useInView(demoRef, { amount: 0.2 });
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(() => !reducedMotion);
  const [selected, setSelected] = useState(0);
  const [resumeAfter, setResumeAfter] = useState(0);
  const completed = stage === 2 ? (selected + 1) * 10 : 0;
  const coolingDown = resumeAfter > 0;

  useEffect(() => {
    if (!playing || !visible || reducedMotion) return;
    if (resumeAfter > 0) {
      const cooldown = window.setTimeout(() => setResumeAfter(0), Math.max(0, resumeAfter - Date.now()));
      return () => window.clearTimeout(cooldown);
    }
    const timer = window.setTimeout(() => {
      if (stage < 2) setStage((value) => value + 1);
      else if (selected < samples.length - 1) setSelected((value) => value + 1);
      else { setStage(0); setSelected(0); }
    }, stage === 2 ? 2800 : 2400);
    return () => window.clearTimeout(timer);
  }, [playing, visible, reducedMotion, stage, selected, resumeAfter]);

  const start = () => { setStage(0); setSelected(0); setResumeAfter(0); setPlaying(true); };
  const inspect = (index: number) => {
    setSelected(index);
    setStage(2);
    if (playing && !reducedMotion) setResumeAfter(Date.now() + 4000);
  };
  const selectStage = (index: number) => {
    setStage(index);
    setSelected(0);
    if (playing && !reducedMotion) setResumeAfter(Date.now() + 4000);
  };
  const values = Object.values(samples[selected]);

  return (
    <div ref={demoRef} className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-medium"><span className="h-2 w-2 rounded-full bg-ring" /> מתבנית למסמכים</div>
        <span className="text-xs text-muted-foreground">המחשה • נתונים לדוגמה</span>
      </div>
      <div className="grid grid-cols-3 border-b border-border">
        {stages.map((label, index) => (
          <Button key={label} variant="ghost" onClick={() => selectStage(index)} aria-pressed={stage === index}
            className={`h-auto min-h-14 whitespace-normal rounded-none px-2 py-3 text-xs sm:text-sm ${stage === index ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
            <span className="hidden sm:inline">{index + 1}.</span>{label}
          </Button>
        ))}
      </div>
      <div className="border-b border-border bg-accent/30 px-4 py-3 sm:px-6" aria-live={playing ? "off" : "polite"}>
        <AnimatePresence mode="wait">
          <motion.p key={stage} initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reducedMotion ? 1 : 0 }} transition={{ duration: 0.2 }} className="text-sm font-medium leading-relaxed">
            {stage === 0 ? "מגדירים פעם אחת מה משתנה במסמך." : stage === 1 ? "כל שורה בטבלה היא אדם — וכל עמודה ממלאת שדה בתבנית." : `הפרטים של ${samples[selected].name} נכנסים לתבנית. אותו עיצוב, מסמך אישי.`}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className={`grid gap-6 p-4 sm:p-6 ${compact ? "md:grid-cols-2" : "lg:grid-cols-[1fr_1.1fr]"}`}>
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Table2 className="h-4 w-4 text-muted-foreground" /> {stage === 0 ? "10 שדות משתנים" : "רשימת האנשים"}</h3>
            <span className="text-xs text-muted-foreground">{stage === 0 ? "Word" : "Excel"}</span>
          </div>
          {stage === 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {labels.map((label) => <div key={label} className="truncate border-b border-border py-2 text-sm text-muted-foreground">{`<<${label}>>`}</div>)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted text-muted-foreground"><tr><th className="p-2 font-medium">שם מלא</th><th className="p-2 font-medium">דירה</th><th className="p-2 font-medium">חניה</th></tr></thead>
                <tbody>{samples.map((sample, index) => <tr key={sample.name} className={`border-b border-border ${index === selected ? "bg-accent/60" : ""}`}>
                  <td className="p-1"><Button variant="ghost" size="sm" className="w-full justify-start px-1" onClick={() => inspect(index)} aria-pressed={index === selected}>{sample.name}</Button></td><td className="p-2">{sample.apartment}</td><td className="p-2">{sample.parking}</td>
                </tr>)}</tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">3 רשומות לדוגמה מתוך 30</p>
            </div>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between text-xs"><span>{stage === 2 ? "מסמכים אישיים" : "30 אנשים"}</span><span dir="ltr" className="font-medium tabular-nums">{completed} / 30</span></div>
            <div className="grid grid-cols-10 gap-1.5" aria-label={`${completed} מסמכים מוכנים בהמחשה`}>
              {Array.from({ length: 30 }, (_, index) => <motion.div key={index} initial={false} animate={{ opacity: index < completed ? 1 : 0.35, scale: index < completed ? 1 : 0.92 }} transition={{ duration: reducedMotion ? 0 : 0.2, delay: reducedMotion ? 0 : (index % 10) * 0.055 }} className={`flex aspect-square items-center justify-center rounded-sm ${index < completed ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {index < completed ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <FileText className="h-3 w-3 sm:h-4 sm:w-4" />}
              </motion.div>)}
            </div>
          </div>
        </div>
        <div className="min-w-0 border-s-0 border-border md:border-s md:ps-6">
          <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{stage === 2 ? `${samples[selected].name} · PDF / Word` : "תבנית Word · אישור מסירה"}</span><FileText className="h-4 w-4 shrink-0" /></div>
          <AnimatePresence mode="wait">
            <motion.div key={`${stage}-${selected}`} initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reducedMotion ? 1 : 0 }} transition={{ duration: 0.25 }} className="border border-border bg-background p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b-2 border-primary pb-3"><div><p className="text-[10px] text-muted-foreground">גני העיר | מסמך לדוגמה</p><h4 className="mt-1 text-lg font-bold">אישור מסירה</h4></div><FileText className="mt-1 h-6 w-6 text-primary" /></div>
              <dl className="space-y-2.5">{labels.map((label, index) => <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-2 text-xs"><dt className="text-muted-foreground">{label}</dt><dd className={`min-w-0 break-words font-medium ${stage === 2 ? "text-foreground" : "text-muted-foreground"}`}>{stage === 2 ? values[index] : `<<${label}>>`}</dd></div>)}</dl>
              <div className="mt-5 flex justify-between border-t border-border pt-3 text-[10px] text-muted-foreground"><span>חתימה: __________</span><span>1 / 1</span></div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
        <span className="text-xs text-muted-foreground">{coolingDown && playing ? "רגע לבדוק את הפרטים…" : stage === 2 ? "אותה תבנית. הנתונים הנכונים לכל אדם." : "מגדירים את השדות פעם אחת."}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="התחל הדגמה מחדש" title="התחל מחדש" onClick={start}><RotateCcw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => { setResumeAfter(0); if (reducedMotion) { if (stage < 2) setStage(stage + 1); else if (selected < 2) setSelected(selected + 1); else { setStage(0); setSelected(0); } } else setPlaying((value) => !value); }}>
            {playing && !reducedMotion ? <Pause /> : <Play className="rotate-180" />}{reducedMotion ? "השלב הבא" : playing ? "השהה" : "המשך הדגמה"}
          </Button>
        </div>
      </div>
    </div>
  );
};