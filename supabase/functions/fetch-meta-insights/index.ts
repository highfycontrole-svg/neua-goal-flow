import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { ad_account_id, level = "campaign", date_start, date_stop, date_preset, campaign_ids, adset_ids, ad_ids } = await req.json();
    if (!ad_account_id) return new Response(JSON.stringify({ error: "Missing ad_account_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: connection } = await supabase.from("meta_connections").select("access_token, token_expires_at").eq("user_id", user.id).single();
    if (!connection) return new Response(JSON.stringify({ error: "No Meta connection" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date())
      return new Response(JSON.stringify({ error: "token_expired" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const accountId = ad_account_id.replace("act_", "");
    const fields = ["campaign_id","campaign_name","adset_id","adset_name","ad_id","ad_name","impressions","reach","frequency","spend","actions","action_values","cost_per_action_type","cpm","cpc","ctr","unique_ctr","clicks","unique_clicks","cost_per_unique_click","outbound_clicks","outbound_clicks_ctr","video_thruplay_watched_actions","website_purchase_roas","purchase_roas","quality_ranking","engagement_rate_ranking","conversion_rate_ranking","date_start","date_stop"].join(",");
    let url = `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=${fields}&level=${level}&limit=500`;
    if (date_preset) url += `&date_preset=${date_preset}`;
    else if (date_start && date_stop) url += `&time_range={"since":"${date_start}","until":"${date_stop}"}`;
    const filtering: any[] = [];
    if (campaign_ids?.length) filtering.push({ field: "campaign.id", operator: "IN", value: campaign_ids });
    if (adset_ids?.length) filtering.push({ field: "adset.id", operator: "IN", value: adset_ids });
    if (ad_ids?.length) filtering.push({ field: "ad.id", operator: "IN", value: ad_ids });
    if (filtering.length) url += `&filtering=${encodeURIComponent(JSON.stringify(filtering))}`;
    url += `&access_token=${connection.access_token}`;
    const data = await (await fetch(url)).json();
    if (data.error) {
      if (data.error.code === 17 || data.error.code === 4)
        return new Response(JSON.stringify({ error: "rate_limit", message: data.error.message }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const insights = data.data || [];
    for (const insight of insights) {
      const objectId = level === "campaign" ? insight.campaign_id : level === "adset" ? insight.adset_id : insight.ad_id;
      const objectName = level === "campaign" ? insight.campaign_name : level === "adset" ? insight.adset_name : insight.ad_name;
      await supabase.from("meta_insights_cache").upsert({ user_id: user.id, ad_account_id: `act_${accountId}`, level, object_id: objectId, object_name: objectName, date_start: insight.date_start, date_stop: insight.date_stop, metrics: insight, synced_at: new Date().toISOString() }, { onConflict: "id" });
    }
    return new Response(JSON.stringify({ insights, synced_at: new Date().toISOString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
