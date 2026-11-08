import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

export const PrivacyBadge = ({ className = "" }: { className?: string }) => (
  <div className={`flex justify-center ${className}`}>
    <Link
      to="/privacy"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <Lock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      הקבצים שלכם מעובדים במכשיר שלכם בלבד ואינם נשמרים באף שרת
    </Link>
  </div>
);
