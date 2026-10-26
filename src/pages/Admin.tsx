import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, ArrowRight } from "lucide-react";

type Tier = "free" | "pro" | "enterprise";
type Row = { id: string; email: string | null; created_at: string; tier: Tier; isAdmin: boolean };

const Admin = () => {
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setState("denied");
    setMe(user.id);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return setState("denied");
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,email,created_at,tier").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role").eq("role", "admin"),
    ]);
    const admins = new Set((roles ?? []).map((r) => r.user_id));
    setRows((profiles ?? []).map((p) => ({ ...p, isAdmin: admins.has(p.id) })));
    setState("ok");
  };

  useEffect(() => { load(); }, []);

  const toggle = async (r: Row) => {
    const { error } = r.isAdmin
      ? await supabase.from("user_roles").delete().eq("user_id", r.id).eq("role", "admin")
      : await supabase.from("user_roles").insert({ user_id: r.id, role: "admin" });
    if (error) toast.error("הפעולה נכשלה");
    else { toast.success("ההרשאה עודכנה"); load(); }
  };

  const setTier = async (r: Row, tier: Tier) => {
    const { error } = await supabase.from("profiles").update({ tier }).eq("id", r.id);
    if (error) toast.error("הפעולה נכשלה");
    else { toast.success("המסלול עודכן"); load(); }
  };

  if (state === "loading") return <div className="p-10 text-center text-muted-foreground" dir="rtl">טוען...</div>;
  if (state === "denied")
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl">
        <Shield className="w-10 h-10 text-muted-foreground" />
        <p className="text-lg">אין לך הרשאה לצפות בעמוד זה</p>
        <Link to="/"><Button variant="outline">חזרה לדף הבית</Button></Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="w-7 h-7 text-primary" />ניהול משתמשים</h1>
          <Link to="/" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"><ArrowRight className="w-4 h-4" />לדף הבית</Link>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr><th className="p-3 text-right">אימייל</th><th className="p-3 text-right">נרשם</th><th className="p-3 text-right">מסלול</th><th className="p-3 text-right">תפקיד</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3" dir="ltr" style={{ textAlign: "right" }}>{r.email}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString("he-IL")}</td>
                  <td className="p-3">
                    <select className="rounded-md border border-input bg-background px-2 py-1" value={r.tier} onChange={(e) => setTier(r, e.target.value as Tier)}>
                      <option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="p-3"><Badge variant={r.isAdmin ? "default" : "secondary"}>{r.isAdmin ? "מנהל" : "משתמש"}</Badge></td>
                  <td className="p-3 text-left">
                    {r.id !== me && (
                      <Button size="sm" variant="outline" onClick={() => toggle(r)}>
                        {r.isAdmin ? "הסר הרשאת מנהל" : "הפוך למנהל"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">אין משתמשים עדיין</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
