
CREATE TABLE IF NOT EXISTS public.meta_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  meta_user_id text,
  meta_user_name text,
  selected_ad_account_id text,
  selected_ad_account_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meta connection" ON public.meta_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meta connection" ON public.meta_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meta connection" ON public.meta_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meta connection" ON public.meta_connections FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.meta_insights_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id text NOT NULL,
  level text NOT NULL,
  object_id text NOT NULL,
  object_name text,
  date_start date NOT NULL,
  date_stop date NOT NULL,
  metrics jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meta_insights_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insights cache" ON public.meta_insights_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights cache" ON public.meta_insights_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights cache" ON public.meta_insights_cache FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights cache" ON public.meta_insights_cache FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_insights_account ON public.meta_insights_cache(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_insights_level ON public.meta_insights_cache(level);
CREATE INDEX IF NOT EXISTS idx_insights_object ON public.meta_insights_cache(object_id);
