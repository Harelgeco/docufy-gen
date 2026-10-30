import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Upload, MousePointerClick, FileDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog, AuthMode } from "@/components/AuthDialog";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ProblemSolution } from "@/components/ProblemSolution";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { LandingFaq } from "@/components/landing/LandingFaq";

const steps = [
  { icon: Upload, title: "מעלים קבצים", text: "תבנית Word עם שדות מסומנים, וקובץ Excel עם הנתונים." },
  { icon: MousePointerClick, title: "בוחרים רשומות", text: "בוחרים את השמות שעבורם רוצים מסמכים, או ממלאים את השדות ידנית." },
  { icon: FileDown, title: "מורידים PDF או Word", text: "צופים בתצוגה מקדימה ומורידים מסמך מותאם לכל רשומה." },
];

const Landing = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const reduce = useReducedMotion();

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

  const fade = (delay = 0) =>
    reduce ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay } };

  const StartButton = ({ className = "" }: { className?: string }) => (
    <Button size="lg" className={`h-12 min-w-44 px-8 text-base gap-2 ${className}`} onClick={() => openAuth("signup")}>
      התחל עכשיו <ArrowLeft className="w-4 h-4" aria-hidden="true" />
    </Button>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="sticky top-0 z-40 bg-background/95 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg whitespace-nowrap">
            <FileText className="w-6 h-6 text-primary" aria-hidden="true" /> מחולל מסמכים
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <Button variant="ghost" className="h-11" onClick={() => supabase.auth.signOut()}>התנתק</Button>
                <Button variant="outline" className="h-11" onClick={() => navigate("/excel")}>לאפליקציה</Button>
              </>
            ) : (
              <>
                <Button variant="link" className="h-11 text-foreground" onClick={() => openAuth("login")}>התחברות</Button>
                <Button variant="outline" className="h-11" onClick={() => openAuth("signup")}>הרשמה</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="hero-wash pointer-events-none absolute inset-0" />
          <div className="relative container mx-auto px-4 max-w-6xl py-12 md:py-20 grid gap-10 md:gap-12 md:grid-cols-2 items-center">
            <div>
              <motion.h1 {...fade(0)} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                אותה תבנית.<br />
                <span className="text-primary">מסמכים מותאמים, בלי למלא הכול מחדש.</span>
              </motion.h1>
              <motion.p {...fade(0.08)} className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                מעלים תבנית Word וקובץ Excel עם הנתונים, בוחרים רשומות ומפיקים מסמך מותאם לכל רשומה.
              </motion.p>
              <motion.div {...fade(0.16)} className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <StartButton className="w-full sm:w-auto" />
                <Button asChild variant="link" className="h-11 text-foreground">
                  <a href="#how">איך זה עובד</a>
                </Button>
              </motion.div>
            </div>
            <motion.div {...fade(0.2)}>
              <HeroIllustration />
            </motion.div>
          </div>
        </section>

        <div className="border-t border-border" />
        <ProblemSolution />

        <section id="how" aria-labelledby="how-title" className="bg-muted/50 py-16 md:py-24 scroll-mt-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 id="how-title" className="text-2xl md:text-3xl font-bold text-center">איך זה עובד</h2>
            <p className="mt-2 mb-10 md:mb-14 text-center text-muted-foreground">שלושה שלבים</p>
            <ol className="grid gap-5 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-xl bg-card border border-border p-6 md:p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{i + 1}</span>
                    <s.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <LandingFaq />

        <section className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 max-w-3xl py-14 md:py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">מוכנים להפסיק להקליד את אותם פרטים שוב?</h2>
            <p className="mt-3 opacity-85">מעלים תבנית ונתונים ומתחילים.</p>
            <Button size="lg" variant="secondary" className="mt-8 h-12 min-w-44 px-8 text-base gap-2" onClick={() => openAuth("signup")}>
              התחל עכשיו <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} מחולל מסמכים</span>
          <nav aria-label="קישורים" className="flex gap-4">
            <a href="#how" className="hover:text-foreground">איך זה עובד</a>
            <Link to="/excel" className="hover:text-foreground">מצב Excel</Link>
            <Link to="/manual" className="hover:text-foreground">הזנה ידנית</Link>
          </nav>
        </div>
      </footer>

      <AuthDialog open={authOpen} mode={mode} onOpenChange={setAuthOpen} onModeChange={setMode} />
    </div>
  );
};

export default Landing;
