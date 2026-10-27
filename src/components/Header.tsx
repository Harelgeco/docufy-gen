import { FileText, Languages } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { translations, Language } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header = ({ language, onLanguageChange }: HeaderProps) => {
  const t = translations[language];
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                {t.appTitle}
              </h1>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                to="/excel"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === "/excel"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t.excelMode}
              </Link>
              <Link
                to="/manual"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === "/manual"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t.manualMode}
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-muted-foreground shrink-0" />
            <div
              role="group"
              aria-label={language === "he" ? "בחירת שפה" : "Select language"}
              className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1"
            >
              {(["he", "en"] as const).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => onLanguageChange(lng)}
                  aria-pressed={language === lng}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                    language === lng
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  )}
                >
                  {lng === "he" ? "עברית" : "English"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
