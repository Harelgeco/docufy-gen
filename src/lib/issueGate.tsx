import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog, AuthMode } from "@/components/AuthDialog";
import { checkIssueAllowance, QUOTA_ENFORCED, FREE_MONTHLY_LIMIT } from "@/lib/quota";
import { toast } from "sonner";
import { saveIssueDraft, claimIssue, deleteIssueDraft, recoveryId, recoveryUrl, type IssueDraft, type IssueFormat } from "./issueRecovery";

/**
 * Guests can do everything except issue documents. `gate(count, run)` runs the
 * download immediately for signed-in users, otherwise opens sign-up and runs it
 * right after the user signs in, so nothing they prepared is lost.
 */
export function useIssueGate(draft: IssueDraft | undefined, handlers: Record<IssueFormat, () => Promise<void>>) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const current = useRef({ draft, handlers });
  current.current = { draft, handlers };
  const busy = useRef(false);
  const idRef = useRef<string | null>(recoveryId());
  const [returnTo, setReturnTo] = useState<string>();

  const tryRun = async (count: number, run: () => Promise<void>) => {
    if (QUOTA_ENFORCED) {
      const { data } = await supabase.rpc("get_issue_usage");
      const row = Array.isArray(data) ? data[0] : data;
      const a = checkIssueAllowance(row?.tier ?? "free", row?.used ?? 0, count);
      if (!a.allowed) {
        toast.error(
          `בחינם אפשר להנפיק ${FREE_MONTHLY_LIMIT} מסמכים בחודש (נשארו ${a.remaining}). לכמות גדולה יותר נדרשת הגרסה בתשלום.`,
        );
        return;
      }
    }
    await run();
  };

  useEffect(() => {
    const resume = async () => {
      const id = idRef.current;
      const saved = current.current.draft;
      if (!id || !saved || busy.current) return;
      busy.current = true;
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        const format = await claimIssue(id);
        if (!format) return;
        setOpen(false);
        await tryRun(saved.kind === "manual" ? 1 : saved.selectedNames?.length ?? 0, current.current.handlers[format]);
        await deleteIssueDraft(id);
        idRef.current = null;
        const url = new URL(window.location.href);
        url.searchParams.delete("resumeIssue");
        window.history.replaceState(window.history.state, "", url);
      } catch {
        toast.error("לא ניתן להמשיך את ההורדה כרגע. העבודה נשמרה; נסו שוב.");
      } finally { busy.current = false; }
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) setTimeout(resume, 0);
    });
    void resume();
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gate = async (count: number, format: IssueFormat) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return tryRun(count, current.current.handlers[format]);
    if (!current.current.draft) return;
    try {
      const id = await saveIssueDraft(current.current.draft, format, idRef.current ?? undefined);
      idRef.current = id;
      const url = recoveryUrl(id);
      window.history.replaceState(window.history.state, "", url);
      setReturnTo(url);
    } catch {
      toast.error("הדפדפן לא מאפשר שמירה זמנית. ההרשמה לא נפתחה כדי שלא תאבדו את העבודה.");
      return;
    }
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
        if (!o && idRef.current) void claimIssue(idRef.current).catch(() => {});
      }}
      onAuthComplete={() => setOpen(false)}
      returnTo={returnTo}
      title={mode === "signup" ? "המסמכים שלכם מוכנים!" : undefined}
      description="הירשמו או התחברו בחינם כדי להוריד — העבודה נשמרת בדפדפן זה ל־24 שעות, גם במעבר לאימות האימייל"
    />
  );

  return { gate, dialog };
}
