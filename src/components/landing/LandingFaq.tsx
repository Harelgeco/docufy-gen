import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "אילו קבצים צריך להכין?", a: "תבנית Word (‎.docx) וקובץ Excel עם הנתונים. בקובץ ה-Excel שורת הכותרות מגדירה את שמות העמודות, וכל שורה מתחתיה היא רשומה." },
  { q: "איך מסמנים שדות בתבנית?", a: "כותבים בתבנית את שם השדה בין סוגריים משולשים, למשל <<שם מלא>>. השם צריך להתאים לכותרת העמודה ב-Excel." },
  { q: "אפשר לבחור רק חלק מהרשומות?", a: "כן. אחרי העלאת הקבצים מופיעה רשימת השמות, ובוחרים רק את הרשומות שעבורן רוצים מסמכים." },
  { q: "אפשר למלא מסמך בלי Excel?", a: "כן. במצב הזנה ידנית מעלים רק תבנית Word, והמערכת מציגה טופס עם השדות שנמצאו בתבנית." },
  { q: "באילו פורמטים מורידים את התוצאה?", a: "PDF או Word. אפשר לצפות בתצוגה מקדימה לפני ההורדה." },
];

export const LandingFaq = () => (
  <section aria-labelledby="faq-title" className="py-16 md:py-24">
    <div className="container mx-auto px-4 max-w-3xl">
      <h2 id="faq-title" className="text-2xl md:text-3xl font-bold text-center mb-8">שאלות נפוצות</h2>
      <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-5">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`q${i}`} className={i === faqs.length - 1 ? "border-b-0" : ""}>
            <AccordionTrigger className="text-right text-base font-semibold min-h-11">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
