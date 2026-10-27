import { useState } from "react";
import { FileText, Languages, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { translations, Language } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "he", label: "עברית" },
  { code: "en", label: "English" },
];

export const Header = ({ language, onLanguageChange }: HeaderProps) => {
  const t = translations[language];
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);

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
            <Popover open={langOpen} onOpenChange={setLangOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 shadow-sm transition-all duration-150 hover:shadow-md active:scale-95"
                  aria-label={language === "he" ? "בחירת שפה" : "Select language"}
                  title={language === "he" ? "בחירת שפה" : "Select language"}
                >
                  <Languages className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-44 p-1.5"
                dir={language === "he" ? "rtl" : "ltr"}
              >
                <div className="px-2 pb-1.5 pt-1 text-xs font-medium text-muted-foreground">
                  {language === "he" ? "בחר שפה" : "Select language"}
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      onLanguageChange(l.code);
                      setLangOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted",
                      language === l.code && "bg-muted/70 font-semibold"
                    )}
                  >
                    <span>{l.label}</span>
                    {language === l.code && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
};
