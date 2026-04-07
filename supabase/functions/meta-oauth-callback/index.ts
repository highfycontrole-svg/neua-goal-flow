import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri)
      return new Response(JSON.stringify({ error: "Missing code or redirect_uri" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    if (!META_APP_ID || !META_APP_SECRET)
      return new Response(JSON.stringify({ error: "Meta app credentials not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const tokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${META_APP_SECRET}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (tokenData.error)
      return new Response(JSON.stringify({ error: tokenData.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const llRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`);
    const llData = await llRes.json();
    if (llData.error)
      return new Response(JSON.stringify({ error: llData.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const accessToken = llData.access_token;
    const expiresIn = llData.expires_in || 5184000;
    const meData = await (await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`)).json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user)
      return new Response(JSON.stringify({ error: "Invalid auth token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const { error: dbError } = await supabase.from("meta_connections").upsert({
      user_id: user.id, access_token: accessToken, token_expires_at: tokenExpiresAt,
      meta_user_id: meData.id, meta_user_name: meData.name,
      connected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (dbError)
      return new Response(JSON.stringify({ error: dbError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ success: true, meta_user_name: meData.name, meta_user_id: meData.id, token_expires_at: tokenExpiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
