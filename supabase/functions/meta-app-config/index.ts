import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const appId = Deno.env.get("META_APP_ID");
  return new Response(JSON.stringify({ app_id: appId || null }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
