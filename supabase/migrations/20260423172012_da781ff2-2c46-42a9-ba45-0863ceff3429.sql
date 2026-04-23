-- Create kpi_meta_ads table for storing editable KPI targets and manual fallback data
CREATE TABLE IF NOT EXISTS public.kpi_meta_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  semana_inicio DATE NOT NULL,
  -- Manual fallback metrics
  investimento NUMERIC DEFAULT 0,
  receita NUMERIC DEFAULT 0,
  compras INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  custo_por_compra NUMERIC DEFAULT 0,
  checkouts INTEGER DEFAULT 0,
  carrinhos INTEGER DEFAULT 0,
  -- Editable targets (metas)
  meta_ctr NUMERIC,
  meta_cpc NUMERIC,
  meta_cpm NUMERIC,
  meta_roas NUMERIC,
  meta_custo_compra NUMERIC,
  meta_checkouts INTEGER,
  meta_carrinhos INTEGER,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, semana_inicio)
);

ALTER TABLE public.kpi_meta_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meta ads kpis"
  ON public.kpi_meta_ads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meta ads kpis"
  ON public.kpi_meta_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meta ads kpis"
  ON public.kpi_meta_ads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meta ads kpis"
  ON public.kpi_meta_ads FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_kpi_meta_ads_updated_at
  BEFORE UPDATE ON public.kpi_meta_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();