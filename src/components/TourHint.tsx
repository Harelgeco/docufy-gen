import { ReactNode } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  children?: ReactNode;
  onClose: () => void;
  floating?: boolean;
  className?: string;
}

/** Temporary guide card for the free-trial walkthrough. */
export function TourHint({ title, children, onClose, floating, className }: Props) {
  return (
    <div
      dir="rtl"
      role="status"
      className={cn(
        "tour-hint-in flex items-start gap-3 rounded-xl border border-ring/40 bg-card p-4 text-card-foreground shadow-lg",
        floating && "fixed bottom-4 left-1/2 z-[60] w-[min(92vw,460px)] -translate-x-1/2",
        className,
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="flex-1 space-y-2">
        <p className="font-semibold text-sm leading-snug">{title}</p>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
      </div>
      <button type="button" aria-label="סגור הדרכה" onClick={onClose} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
