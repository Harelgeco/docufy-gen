import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog, AuthMode } from "@/components/AuthDialog";
import { checkIssueAllowance, QUOTA_ENFORCED, FREE_MONTHLY_LIMIT } from "@/lib/quota";
import { toast } from "sonner";

/**
 * Guests can do everything except issue documents. `gate(count, run)` runs the
 * download immediately for signed-in users, otherwise opens sign-up and runs it
 * right after the user signs in, so nothing they prepared is lost.
 */
export function useIssueGate() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const pending = useRef<{ count: number; run: () => void } | null>(null);

  const tryRun = async (count: number, run: () => void) => {
    if (QUOTA_ENFORCED) {
      const { data } = await supabase.from("profiles").select("tier, documents_issued").maybeSingle();
      // TODO: replace documents_issued with a per-month counter when quotas go live.
      const a = checkIssueAllowance(data?.tier ?? "free", data?.documents_issued ?? 0, count);
      if (!a.allowed) {
        toast.error(
          `בחינם אפשר להנפיק ${FREE_MONTHLY_LIMIT} מסמכים בחודש (נשארו ${a.remaining}). לכמות גדולה יותר נדרשת הגרסה בתשלום.`,
        );
        return;
      }
    }
    run();
  };

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && pending.current) {
        const p = pending.current;
        pending.current = null;
        setOpen(false);
        setTimeout(() => tryRun(p.count, p.run), 0);
      }
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gate = async (count: number, run: () => void) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return tryRun(count, run);
    pending.current = { count, run };
    setMode("signup");
    setOpen(true);
  };

  const dialog = (
    <AuthDialog
      open={open}
      mode={mode}
      onModeChange={setMode}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) pending.current = null;
      }}
      title={mode === "signup" ? "המסמכים שלכם מוכנים!" : undefined}
      description="הירשמו או התחברו בחינם כדי להוריד אותם — כל מה שהכנתם נשמר"
    />
  );

  return { gate, dialog };
}
