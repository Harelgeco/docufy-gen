import { FileText, Languages } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => onLanguageChange(language === "he" ? "en" : "he")}
              aria-label={language === "he" ? "Switch to English" : "החלף לעברית"}
              title={language === "he" ? "Switch to English" : "החלף לעברית"}
            >
              <Languages className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
