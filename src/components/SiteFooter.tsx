import { Link, useLocation } from "react-router-dom";

export const SiteFooter = ({ hideOn = [] }: { hideOn?: string[] }) => {
  const { pathname } = useLocation();
  if (hideOn.includes(pathname) || pathname === "/admin") return null;
  return (
    <footer className="border-t border-border" dir="rtl">
      <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} מחולל מסמכים</span>
        <nav aria-label="קישורים" className="flex flex-wrap justify-center gap-4">
          <Link to="/#how" className="hover:text-foreground">איך זה עובד</Link>
          <Link to="/excel" className="hover:text-foreground">מצב Excel</Link>
          <Link to="/manual" className="hover:text-foreground">הזנה ידנית</Link>
          <Link to="/privacy" className="hover:text-foreground">מדיניות פרטיות</Link>
          <Link to="/terms" className="hover:text-foreground">תנאי שימוש</Link>
        </nav>
      </div>
    </footer>
  );
};
