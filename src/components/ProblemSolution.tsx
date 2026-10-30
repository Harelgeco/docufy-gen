import { Repeat, Combine, FileCheck2 } from "lucide-react";

const items = [
  { icon: Repeat, title: "הבעיה", text: "אותו מסמך, שוב ושוב: מעתיקים שם, מספר זהות ותאריך לכל עותק בנפרד." },
  { icon: Combine, title: "הפתרון", text: "מכינים פעם אחת תבנית עם שדות, ומחברים אליה את הנתונים מהטבלה." },
  { icon: FileCheck2, title: "התוצאה", text: "מסמך מותאם לכל רשומה, מוכן לבדיקה ולהמשך עבודה." },
];

export const ProblemSolution = () => (
  <section aria-labelledby="why-title" className="py-16 md:py-24">
    <div className="container mx-auto px-4 max-w-6xl">
      <h2 id="why-title" className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-14">למה צריך את זה</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((it) => (
          <article key={it.title} className="rounded-xl border border-border bg-card p-6 md:p-7">
            <it.icon className="w-7 h-7 text-primary mb-4" aria-hidden="true" />
            <h3 className="text-xl font-bold mb-2">{it.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{it.text}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
