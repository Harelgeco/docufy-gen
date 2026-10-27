import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Clock, Check } from "lucide-react";

const scenes = [
  { label: "הבעיה", title: "30 אנשים, 30 מסמכים", text: "ממלאים כל מסמך לבד, שם אחרי שם. זה לוקח שעות, ותמיד נופלת טעות." },
  { label: "הפתרון", title: "ממלאים פעם אחת", text: "מעלים את הרשימה ואת המסמך, והמערכת ממלאת את כולם בשבילכם." },
  { label: "התוצאה", title: "הכול מוכן תוך דקה", text: "כל המסמכים מוכנים, נקיים ונראים בדיוק כמו המקור." },
];

const DURATION = 4500;

export const ProblemSolution = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % scenes.length), DURATION);
    return () => clearInterval(t);
  }, []);
  const s = scenes[i];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[320px]">
            <div className="relative bg-muted/60 flex items-center justify-center p-8 overflow-hidden">
              <AnimatePresence mode="wait">
                {i === 0 && (
                  <motion.div key="p" className="relative w-40 h-48" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <motion.div key={n} className="absolute inset-0 rounded-md border border-border bg-card shadow-sm p-3"
                        initial={{ y: -40, opacity: 0, rotate: 0 }}
                        animate={{ y: n * 6, x: n * 6, opacity: 1, rotate: (n % 2 ? 4 : -4) }}
                        transition={{ delay: n * 0.35, duration: 0.4 }}>
                        <div className="h-2 w-2/3 rounded bg-muted-foreground/30" />
                        <div className="mt-2 h-2 w-1/2 rounded bg-muted-foreground/20" />
                      </motion.div>
                    ))}
                    <motion.div className="absolute -top-4 -left-4 rounded-full bg-destructive text-destructive-foreground p-2"
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                      <Clock className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                )}
                {i === 1 && (
                  <motion.div key="s" className="flex items-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="rounded-md border border-border bg-card p-3 shadow-sm">
                      <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {[0, 1, 2, 3].map((n) => (
                        <motion.div key={n} className="h-8 w-24 rounded-md border border-border bg-card shadow-sm"
                          initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + n * 0.25, duration: 0.35 }} />
                      ))}
                    </div>
                  </motion.div>
                )}
                {i === 2 && (
                  <motion.div key="r" className="grid grid-cols-3 gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {Array.from({ length: 9 }).map((_, n) => (
                      <motion.div key={n} className="relative h-14 w-11 rounded border border-border bg-card shadow-sm"
                        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: n * 0.08 }}>
                        <Check className="absolute bottom-1 left-1 w-4 h-4 text-accent" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <span className="text-sm font-semibold text-primary">{s.label}</span>
                  <h3 className="mt-2 text-2xl md:text-3xl font-bold">{s.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{s.text}</p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-8 flex gap-2">
                {scenes.map((sc, n) => (
                  <button key={n} onClick={() => setI(n)} aria-label={sc.label}
                    className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    {n === i && (
                      <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: "100%" }}
                        transition={{ duration: DURATION / 1000, ease: "linear" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
