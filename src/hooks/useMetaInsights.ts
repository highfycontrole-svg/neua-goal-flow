import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type InsightLevel = "campaign" | "adset" | "ad";

export interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  spend?: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  unique_ctr?: string;
  clicks?: string;
  unique_clicks?: string;
  cost_per_unique_click?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  outbound_clicks?: Array<{ action_type: string; value: string }>;
  outbound_clicks_ctr?: Array<{ action_type: string; value: string }>;
  website_purchase_roas?: Array<{ action_type: string; value: string }>;
  purchase_roas?: Array<{ action_type: string; value: string }>;
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
  date_start?: string;
  date_stop?: string;
  video_thruplay_watched_actions?: Array<{ action_type: string; value: string }>;
}

export function useMetaInsights() {
  const [insights, setInsights] = useState<MetaInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchInsights = useCallback(async (params: {
    ad_account_id: string;
    level: InsightLevel;
    date_start?: string;
    date_stop?: string;
    date_preset?: string;
    campaign_ids?: string[];
    adset_ids?: string[];
    ad_ids?: string[];
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("fetch-meta-insights", { body: params });
      if (err) throw err;
      if (data.error) {
        if (data.error === "token_expired") { setError("token_expired"); return; }
        if (data.error === "rate_limit") { setError("rate_limit"); return; }
        throw new Error(data.error);
      }
      setInsights(data.insights || []);
      setLastSynced(data.synced_at || new Date().toISOString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, loading, error, lastSynced, fetchInsights };
}

export function getActionValue(actions: Array<{ action_type: string; value: string }> | undefined, actionType: string): number {
  if (!actions) return 0;
  const a = actions.find(a => a.action_type === actionType);
  return a ? Number(a.value) : 0;
}
