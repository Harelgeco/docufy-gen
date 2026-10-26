import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export type AuthMode = "login" | "signup";

const schema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה").max(255),
  password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים").max(72),
});

interface Props {
  open: boolean;
  mode: AuthMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AuthMode) => void;
}

export const AuthDialog = ({ open, mode, onOpenChange, onModeChange }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ email: f.email?.[0], password: f.password?.[0] });
      return;
    }
    setErrors({});
    setLoading(true);
    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else {
        toast.success("נשלח אליך מייל לאימות החשבון");
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) toast.error("אימייל או סיסמה שגויים");
      else {
        toast.success("התחברת בהצלחה");
        onOpenChange(false);
      }
    }
    setLoading(false);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("ההתחברות עם Google נכשלה");
      return;
    }
    if (result.redirected) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="text-2xl">{isSignup ? "יצירת חשבון" : "התחברות"}</DialogTitle>
          <DialogDescription>
            {isSignup ? "התחל ליצור מסמכים מותאמים בדקות" : "ברוך שובך! התחבר כדי להמשיך"}
          </DialogDescription>
        </DialogHeader>

        <Button variant="outline" className="w-full h-11 gap-2" onClick={google} type="button">
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          המשך עם Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> או <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">אימייל</Label>
            <Input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">סיסמה</Label>
            <Input id="password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "רגע..." : isSignup ? "הרשמה" : "התחברות"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          {isSignup ? "כבר יש לך חשבון?" : "אין לך חשבון?"}{" "}
          <button className="text-primary font-medium hover:underline" onClick={() => onModeChange(isSignup ? "login" : "signup")}>
            {isSignup ? "התחבר" : "הירשם"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};
