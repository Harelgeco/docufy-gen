import { useRef } from "react";
import { Wand2 } from "lucide-react";

interface Props {
  language: "he" | "en";
  onPick: (file: File) => void;
}

/** Lets users upload a finished Word document and mark fields on it themselves. */
export function ReadyDocumentButton({ language, onPick }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const he = language === "he";
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-3 flex w-full items-center gap-3 rounded-lg border border-dashed border-ring/50 bg-accent/50 p-3 text-start transition-colors hover:bg-accent"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Wand2 className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-primary">
            {he ? "אין לכם תבנית? צרו אותה בעצמכם" : "No template? Create one yourself"}
          </span>
          <span className="block text-xs text-muted-foreground">
            {he
              ? "העלו מסמך Word מוכן לדוגמה וסמנו עליו בעכבר את הפרטים שמשתנים"
              : "Upload a finished Word document and mark the changing details with your mouse"}
          </span>
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
