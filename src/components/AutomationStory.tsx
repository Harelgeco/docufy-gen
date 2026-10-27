import { useState } from "react";
import { ArrowLeft, Copy, FileText } from "lucide-react";
import { AutomationDemo } from "@/components/AutomationDemo";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { repeatedEdits } from "@/lib/demoMetrics";

export const AutomationStory = ({ onStart }: { onStart: () => void }) => {
  const [people, setPeople] = useState(30);
  const [fields, setFields] = useState(10);

  return <>
    <section id="automation-demo" className="scroll-mt-20 border-y border-border bg-card py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-medium text-muted-foreground">אותו מסמך. אדם אחר. שוב ושוב.</p>
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">30 אנשים. 10 שדות.<br />למה לשנות אותם 300 פעמים?</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">שם, מספר זהות, כתובת, סכום ותאריך — במקום לפתוח כל מסמך ולשנות אותם ידנית, מחברים את תבנית ה־Word לנתונים ומפיקים מסמך אישי לכל אדם.</p>
        </div>
        <AutomationDemo />
        <p className="mt-3 text-xs text-muted-foreground">המחשה של התהליך, לא מדידת זמן הפקה. משך ההפקה תלוי בכמות המסמכים ובתבנית.</p>
      </div>
    </section>
    <section className="py-12 md:py-16">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">כמה פעמים אתם משנים<br />את אותם שדות?</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">חוזים, אישורים, מכתבים וטפסים: כשהמבנה חוזר על עצמו ורק הפרטים משתנים, אין צורך להתחיל מחדש לכל אדם.</p>
          <div className="mt-8 space-y-7">
            <div><label id="people-label" className="mb-4 flex justify-between text-sm font-medium"><span>מספר אנשים</span><span>{people}</span></label><Slider aria-labelledby="people-label" dir="rtl" min={1} max={100} step={1} value={[people]} onValueChange={([value]) => setPeople(value)} /></div>
            <div><label id="fields-label" className="mb-4 flex justify-between text-sm font-medium"><span>שדות משתנים בכל מסמך</span><span>{fields}</span></label><Slider aria-labelledby="fields-label" dir="rtl" min={1} max={20} step={1} value={[fields]} onValueChange={([value]) => setFields(value)} /></div>
          </div>
        </div>
        <div className="divide-y divide-border border-y border-border" aria-live="polite">
          <div className="py-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Copy className="h-4 w-4" /> במילוי ידני</div><p className="mt-3 text-5xl font-bold tabular-nums">{repeatedEdits(people, fields).toLocaleString("he-IL")}</p><p className="mt-2 text-sm text-muted-foreground">החלפות שדות לאורך {people} מסמכים</p></div>
          <div className="py-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> עם מחולל המסמכים</div><p className="mt-3 text-2xl font-semibold">תבנית אחת + טבלת נתונים</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">מגדירים {fields} שדות בתבנית פעם אחת. בוחרים {people} אנשים ומפיקים עבורם מסמכים אישיים.</p></div>
        </div>
      </div>
    </section>
    <section className="border-t border-border bg-card py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4"><h2 className="mb-6 text-2xl font-bold md:text-3xl">לפני שמתחילים</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="templates"><AccordionTrigger className="gap-4 text-start">אפשר להשתמש בתבנית Word שכבר יש לי?</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">כן. מסמנים בתבנית את הפרטים שצריכים להשתנות, למשל {"<<שם מלא>>"}, ומעלים את הקובץ. התבנית היא הבסיס למסמך האישי.</AccordionContent></AccordionItem>
          <AccordionItem value="manual"><AccordionTrigger className="gap-4 text-start">ומה אם אין לי קובץ Excel?</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">אפשר לבחור בהזנה ידנית, להעלות תבנית Word ולמלא את השדות שנמצאו בה. זה מתאים גם להפקת מסמך בודד.</AccordionContent></AccordionItem>
          <AccordionItem value="formats"><AccordionTrigger className="gap-4 text-start">באיזה פורמט מקבלים את המסמכים?</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">אפשר להוריד Word להמשך עריכה או PDF לשליחה. לפני ההפקה ניתן לפתוח את התצוגה המקדימה ולבדוק את הפרטים; בתבניות מורכבות מומלץ לבדוק גם את הקובץ שהופק.</AccordionContent></AccordionItem>
        </Accordion>
      </div>
    </section>
    <section className="border-t border-border bg-accent/40 py-12 text-center md:py-16"><div className="mx-auto max-w-2xl px-4"><h2 className="text-2xl font-bold md:text-3xl">המסמך הבא לא צריך להתחיל בהעתק־הדבק.</h2><p className="mt-3 text-muted-foreground">התבנית שלכם. הנתונים שלכם. מסמכים לכל מי שצריך.</p><Button size="lg" className="mt-6" onClick={onStart}>התחל עם התבנית שלך <ArrowLeft className="h-4 w-4" /></Button></div></section>
  </>;
};