-- Campanhas UTM
CREATE TABLE public.utm_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Links UTM individuais
CREATE TABLE public.utm_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.utm_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  label TEXT,
  base_url TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_term TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.utm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own utm_campaigns" ON public.utm_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own utm_campaigns" ON public.utm_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own utm_campaigns" ON public.utm_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own utm_campaigns" ON public.utm_campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select own utm_links" ON public.utm_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own utm_links" ON public.utm_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own utm_links" ON public.utm_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own utm_links" ON public.utm_links FOR DELETE USING (auth.uid() = user_id);