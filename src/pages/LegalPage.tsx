import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

type Section = { h: string; p: string[] };

const privacy: Section[] = [
  { h: "העיקר בקצרה", p: ["קובצי ה-Word וה-Excel שאתם מעלים מעובדים אך ורק בתוך הדפדפן, במכשיר שלכם. הם אינם נשלחים לשרת, אינם מועברים לצד שלישי ואינם נשמרים אצלנו באף מאגר מידע.", "גם המסמכים שמופקים (PDF ו-Word) נוצרים במכשיר שלכם ויורדים אליו ישירות."] },
  { h: "מה כן נשמר", p: ["אם נרשמתם: כתובת האימייל שלכם, סוג המנוי, ומספר המסמכים שהפקתם — כדי לנהל את החשבון ואת מכסת השימוש.", "לא נשמרים שמות, פרטים או כל תוכן אחר מתוך הקבצים שלכם."] },
  { h: "שמירה זמנית בדפדפן", p: ["כדי שלא תאבדו עבודה ברענון הדף, התבנית שסימנתם בה שדות נשמרת זמנית באחסון של הדפדפן שלכם בלבד, ונמחקת עם סגירת הלשונית."] },
  { h: "התחברות", p: ["ההתחברות מתבצעת באימייל או דרך Google. אנחנו מקבלים רק את כתובת האימייל ואת מזהה החשבון."] },
  { h: "מחיקת חשבון", p: ["אפשר לבקש מחיקה של החשבון ושל כל המידע שנשמר עליו בכל עת."] },
  { h: "שינויים במדיניות", p: ["אם המדיניות תשתנה, נעדכן את העמוד הזה ואת תאריך העדכון."] },
];

const terms: Section[] = [
  { h: "השימוש בשירות", p: ["השירות מאפשר להפיק מסמכים מותאמים אישית מתבנית Word ומנתונים. השימוש מותר למטרות חוקיות בלבד."] },
  { h: "אחריות על התוכן", p: ["אתם אחראים לתוכן התבניות והנתונים שאתם משתמשים בהם, ולכך שיש לכם זכות להשתמש בהם. בדקו כל מסמך לפני שליחתו או שימוש בו."] },
  { h: "חשבון ומכסות", p: ["חלק מהפעולות, כמו הורדת מסמכים, דורשות חשבון. ייתכנו מגבלות שימוש לפי סוג המנוי."] },
  { h: "זמינות השירות", p: ["השירות ניתן כמות שהוא (AS IS). אנחנו עושים מאמץ שיהיה זמין ותקין, אך איננו מתחייבים לזמינות רציפה או להיעדר תקלות."] },
  { h: "הגבלת אחריות", p: ["לא נהיה אחראים לנזק שנגרם משימוש בשירות או ממסמכים שהופקו בו, ככל שהחוק מתיר."] },
  { h: "שינויים", p: ["ייתכן שנעדכן את התנאים מעת לעת. המשך השימוש לאחר עדכון מהווה הסכמה לתנאים המעודכנים."] },
];

const LegalPage = ({ kind }: { kind: "privacy" | "terms" }) => {
  const sections = kind === "privacy" ? privacy : terms;
  const title = kind === "privacy" ? "מדיניות פרטיות" : "תנאי שימוש";
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg">
            <FileText className="h-6 w-6 text-primary" /> מחולל מסמכים
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">עודכן לאחרונה: נובמבר 2026</p>
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold mb-2">{s.h}</h2>
              {s.p.map((p) => <p key={p} className="text-muted-foreground leading-relaxed mb-2">{p}</p>)}
            </section>
          ))}
        </div>
        <div className="mt-12 flex gap-4 text-sm">
          <Link to={kind === "privacy" ? "/terms" : "/privacy"} className="text-primary hover:underline">
            {kind === "privacy" ? "תנאי שימוש" : "מדיניות פרטיות"}
          </Link>
          <Link to="/" className="text-primary hover:underline">חזרה לדף הבית</Link>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
