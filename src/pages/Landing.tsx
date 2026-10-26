import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Upload, MousePointerClick, FileDown, Play, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthDialog, AuthMode } from "@/components/AuthDialog";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const features = [
  { icon: Upload, title: "העלה קבצים", text: "\n" },
  { icon: MousePointerClick, title: "בחר רשומות", text: "בחר את השמות שעבורם תרצה מסמכים — או מלא את השדות ידנית." },
  { icon: FileDown, title: "הורד PDF או וורד", text: "קבל מסמכים מוכנים ששומרים בדיוק על העיצוב המקורי של התבנית." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const cta = "transition-all duration-200 hover:scale-105 hover:shadow-lg";

const Landing = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [demoOpen, setDemoOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    return () => data.subscription.unsubscribe();
  }, []);

  const openAuth = (m: AuthMode) => {
    if (user) return navigate("/excel");
    setMode(m);
    setAuthOpen(true);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <FileText className="w-7 h-7 text-primary" /> מחולל מסמכים
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => supabase.auth.signOut()}>התנתק</Button>
                <Button className={cta} onClick={() => navigate("/excel")}>לאפליקציה</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => openAuth("login")}>התחברות</Button>
                <Button className={cta} onClick={() => openAuth("signup")}>הרשמה</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="container mx-auto px-4 py-24 md:py-36 text-center max-w-4xl">
          <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <Sparkles className="w-4 h-4 text-primary" /> אקסל + וורד = מסמכים מוכנים
          </motion.div>
          <motion.h1 custom={1} initial="hidden" animate="show" variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            מאות מסמכים מותאמים.<br /><span className="text-primary">בלחיצה אחת.</span>
          </motion.h1>
          <motion.p custom={2} initial="hidden" animate="show" variants={fadeUp}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            מייצר מסמכים מהתבניות שלכם.
          </motion.p>
          <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className={`h-12 px-8 text-base gap-2 ${cta}`} onClick={() => openAuth("signup")}>
              התחל עכשיו <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className={`h-12 px-8 text-base gap-2 ${cta}`} onClick={() => setDemoOpen(true)}>
              <Play className="w-4 h-4" /> צפה בהדגמה
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/50 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">איך זה עובד</h2>
            <p className="mt-3 text-muted-foreground">שלושה צעדים פשוטים</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="rounded-2xl bg-card border border-border p-8 shadow-sm hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary mb-1">שלב {i + 1}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} מחולל מסמכים</footer>

      <AuthDialog open={authOpen} mode={mode} onOpenChange={setAuthOpen} onModeChange={setMode} />
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogTitle>הדגמה</DialogTitle>
          <div className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Play className="w-12 h-12" /> סרטון ההדגמה יעלה בקרוב
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
