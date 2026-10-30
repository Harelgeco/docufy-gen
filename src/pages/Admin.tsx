import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./NotFound";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Shield, ArrowRight, Ban, Trash2, UserCheck } from "lucide-react";

type Tier = "free" | "pro" | "enterprise";
type Row = {
  id: string; email: string | null; created_at: string; tier: Tier; documents_issued: number;
  last_sign_in_at: string | null; banned_until: string | null; is_admin: boolean;
};
type Pending = { kind: "admin" | "block" | "unblock" | "delete"; row: Row } | null;

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }) : "—";

const Admin = () => {
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setState("denied");
    setMe(user.id);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return setState("denied");
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error("טעינת המשתמשים נכשלה");
    setRows((data ?? []) as Row[]);
    setState("ok");
  };

  useEffect(() => { load(); }, []);

  const isBlocked = (r: Row) => !!r.banned_until && new Date(r.banned_until) > new Date();

  const run = async () => {
    if (!pending) return;
    const { kind, row: r } = pending;
    setBusy(true);
    let error: unknown = null;
    if (kind === "admin") {
      ({ error } = r.is_admin
        ? await supabase.from("user_roles").delete().eq("user_id", r.id).eq("role", "admin")
        : await supabase.from("user_roles").insert({ user_id: r.id, role: "admin" }));
    } else {
      const res = await supabase.functions.invoke("admin-users", { body: { action: kind, userId: r.id } });
      error = res.error || res.data?.error;
    }
    setBusy(false);
    setPending(null);
    if (error) toast.error("הפעולה נכשלה");
    else { toast.success("בוצע"); load(); }
  };

  const setTier = async (r: Row, tier: Tier) => {
    const { error } = await supabase.from("profiles").update({ tier }).eq("id", r.id);
    if (error) toast.error("הפעולה נכשלה");
    else { toast.success("המסלול עודכן"); load(); }
  };

  const dialogText = (() => {
    if (!pending) return { title: "", body: "", action: "" };
    const e = pending.row.email;
    switch (pending.kind) {
      case "admin":
        return pending.row.is_admin
          ? { title: "להסיר הרשאת מנהל?", body: `${e} לא יוכל יותר לנהל משתמשים.`, action: "הסר הרשאה" }
          : { title: "להפוך למנהל?", body: `${e} יוכל לראות את כל המשתמשים, לחסום, למחוק ולשנות הרשאות.`, action: "כן, הפוך למנהל" };
      case "block": return { title: "לחסום משתמש?", body: `${e} לא יוכל להתחבר עד שתבטל את החסימה.`, action: "חסום" };
      case "unblock": return { title: "לבטל חסימה?", body: `${e} יוכל להתחבר שוב.`, action: "בטל חסימה" };
      case "delete": return { title: "למחוק משתמש לצמיתות?", body: `החשבון של ${e} יימחק ולא ניתן יהיה לשחזר אותו.`, action: "מחק לצמיתות" };
    }
  })();

  if (state === "loading") return <div className="min-h-screen bg-background" />;
  if (state === "denied") return <NotFound />;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="w-7 h-7 text-primary" />ניהול משתמשים</h1>
          <Link to="/" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"><ArrowRight className="w-4 h-4" />לדף הבית</Link>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-right">אימייל</th>
                <th className="p-3 text-right">נרשם</th>
                <th className="p-3 text-right">התחברות אחרונה</th>
                <th className="p-3 text-right">מסמכים</th>
                <th className="p-3 text-right">מסלול</th>
                <th className="p-3 text-right">תפקיד</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3" dir="ltr" style={{ textAlign: "right" }}>{r.email}</td>
                  <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("he-IL")}</td>
                  <td className="p-3 whitespace-nowrap">{fmt(r.last_sign_in_at)}</td>
                  <td className="p-3 font-medium">{r.documents_issued}</td>
                  <td className="p-3">
                    <select className="rounded-md border border-input bg-background px-2 py-1" value={r.tier} onChange={(e) => setTier(r, e.target.value as Tier)}>
                      <option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="p-3 space-x-1 space-x-reverse whitespace-nowrap">
                    <Badge variant={r.is_admin ? "default" : "secondary"}>{r.is_admin ? "מנהל" : "משתמש"}</Badge>
                    {isBlocked(r) && <Badge variant="destructive">חסום</Badge>}
                  </td>
                  <td className="p-3">
                    {r.id !== me && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setPending({ kind: "admin", row: r })}>
                          {r.is_admin ? "הסר הרשאת מנהל" : "הפוך למנהל"}
                        </Button>
                        <Button size="icon" variant="outline" className="h-9 w-9"
                          title={isBlocked(r) ? "בטל חסימה" : "חסום"}
                          onClick={() => setPending({ kind: isBlocked(r) ? "unblock" : "block", row: r })}>
                          {isBlocked(r) ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="outline" className="h-9 w-9 text-destructive hover:text-destructive"
                          title="מחק" onClick={() => setPending({ kind: "delete", row: r })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">אין משתמשים עדיין</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && !busy && setPending(null)}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>{dialogText.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogText.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={busy}>ביטול</AlertDialogCancel>
            <AlertDialogAction disabled={busy}
              className={pending?.kind === "delete" || pending?.kind === "block" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={(e) => { e.preventDefault(); run(); }}>
              {busy ? "מבצע..." : dialogText.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
