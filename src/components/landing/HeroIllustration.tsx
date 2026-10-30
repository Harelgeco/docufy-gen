import { FileText, Table2, ArrowLeft } from "lucide-react";

const rows = [
  ["דנה לוי", "12/03"],
  ["יוסי כהן", "14/03"],
  ["מיכל אברהם", "20/03"],
];

/** Static illustration with synthetic sample data: template + rows -> documents. */
export const HeroIllustration = () => (
  <figure className="relative rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm" aria-label="המחשה: תבנית Word ונתוני Excel הופכים למסמכים מותאמים">
    <span className="absolute top-3 left-3 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">המחשה</span>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 pt-4">
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2"><FileText className="w-4 h-4" /> תבנית Word</div>
          <p className="text-xs leading-6 text-muted-foreground">
            לכבוד <mark className="rounded bg-accent px-1 text-foreground">&lt;&lt;שם&gt;&gt;</mark><br />
            תאריך: <mark className="rounded bg-accent px-1 text-foreground">&lt;&lt;תאריך&gt;&gt;</mark>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2"><Table2 className="w-4 h-4" /> נתוני Excel</div>
          <table className="w-full text-xs text-muted-foreground">
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} className="border-t border-border first:border-0">
                  <td className="py-1">{r[0]}</td><td className="py-1 text-left">{r[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ArrowLeft className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r[0]} className="rounded-lg border border-border bg-background p-2.5 text-xs">
            <div className="font-semibold text-foreground">לכבוד {r[0]}</div>
            <div className="text-muted-foreground">תאריך: {r[1]}</div>
          </div>
        ))}
      </div>
    </div>
    <figcaption className="sr-only">דוגמה עם נתונים מומצאים</figcaption>
  </figure>
);
