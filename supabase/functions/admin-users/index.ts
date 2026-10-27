import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const { action, userId } = await req.json();
    if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "bad user" }, 400);
    if (userId === user.id) return json({ error: "cannot act on yourself" }, 400);

    let error;
    if (action === "block") ({ error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" }));
    else if (action === "unblock") ({ error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" }));
    else if (action === "delete") ({ error } = await admin.auth.admin.deleteUser(userId));
    else return json({ error: "bad action" }, 400);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
