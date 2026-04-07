import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MetaConnection {
  id: string;
  user_id: string;
  access_token: string;
  token_expires_at: string | null;
  meta_user_id: string | null;
  meta_user_name: string | null;
  selected_ad_account_id: string | null;
  selected_ad_account_name: string | null;
  connected_at: string;
  updated_at: string;
}

export interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
}

export function useMetaConnection() {
  const [connection, setConnection] = useState<MetaConnection | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error: err } = await (supabase as any).from("meta_connections").select("*").eq("user_id", user.id).maybeSingle();
      if (err) throw err;
      setConnection(data as MetaConnection | null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConnection(); }, [fetchConnection]);

  const fetchAdAccounts = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.functions.invoke("fetch-meta-adaccounts");
      if (err) throw err;
      if (data.error) {
        if (data.error === "token_expired") setError("token_expired");
        else throw new Error(data.error);
        return;
      }
      setAdAccounts(data.accounts || []);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { if (connection) fetchAdAccounts(); }, [connection, fetchAdAccounts]);

  const selectAdAccount = useCallback(async (accountId: string, accountName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from("meta_connections").update({
      selected_ad_account_id: accountId,
      selected_ad_account_name: accountName,
    }).eq("user_id", user.id);
    setConnection(prev => prev ? { ...prev, selected_ad_account_id: accountId, selected_ad_account_name: accountName } : prev);
  }, []);

  const disconnect = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: conn } = await (supabase as any).from("meta_connections").select("access_token, meta_user_id").eq("user_id", user.id).maybeSingle();
    await (supabase as any).from("meta_connections").delete().eq("user_id", user.id);
    if (conn?.access_token && conn?.meta_user_id) {
      try {
        await fetch(`https://graph.facebook.com/v21.0/${conn.meta_user_id}/permissions?access_token=${conn.access_token}`, { method: "DELETE" });
      } catch (_) {}
    }
    setConnection(null);
    setAdAccounts([]);
    setError(null);
  }, []);

  const startOAuth = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("meta-app-config");
    if (error || !data?.app_id) throw new Error("META_APP_ID não configurado no backend.");
    const redirectUri = `${window.location.origin}/ads-neua/callback`;
    const scope = "ads_read,ads_management,business_management,pages_read_engagement";
    window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${data.app_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  }, []);

  const exchangeCode = useCallback(async (code: string) => {
    const redirectUri = `${window.location.origin}/ads-neua/callback`;
    const { data, error: err } = await supabase.functions.invoke("meta-oauth-callback", { body: { code, redirect_uri: redirectUri } });
    if (err) throw err;
    if (data.error) throw new Error(data.error);
    await fetchConnection();
    return data;
  }, [fetchConnection]);

  return { connection, adAccounts, loading, error, setError, selectAdAccount, disconnect, startOAuth, exchangeCode, refetch: fetchConnection };
}
