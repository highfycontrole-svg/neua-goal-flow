
CREATE TABLE public.kpi_manychat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  semana_inicio date NOT NULL,
  investimento numeric DEFAULT 0,
  disparos integer DEFAULT 0,
  ctr_fluxo numeric DEFAULT 0,
  pct_conclusao numeric DEFAULT 0,
  leads_gerados integer DEFAULT 0,
  vendas_atribuidas integer DEFAULT 0,
  receita_atribuida numeric DEFAULT 0,
  ponto_abandono text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, semana_inicio)
);
ALTER TABLE public.kpi_manychat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own manychat kpis" ON public.kpi_manychat FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own manychat kpis" ON public.kpi_manychat FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own manychat kpis" ON public.kpi_manychat FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own manychat kpis" ON public.kpi_manychat FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.kpi_grupo_vip (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  semana_inicio date NOT NULL,
  total_membros integer DEFAULT 0,
  novos_membros integer DEFAULT 0,
  mensagens_enviadas integer DEFAULT 0,
  cliques_links integer DEFAULT 0,
  vendas_atribuidas integer DEFAULT 0,
  receita_atribuida numeric DEFAULT 0,
  investimento numeric DEFAULT 0,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, semana_inicio)
);
ALTER TABLE public.kpi_grupo_vip ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own grupo vip kpis" ON public.kpi_grupo_vip FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grupo vip kpis" ON public.kpi_grupo_vip FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grupo vip kpis" ON public.kpi_grupo_vip FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grupo vip kpis" ON public.kpi_grupo_vip FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.kpi_cac_canal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mes integer NOT NULL,
  ano integer NOT NULL,
  cac_meta_ads numeric DEFAULT 0,
  cac_google_ads numeric DEFAULT 0,
  cac_organico numeric DEFAULT 0,
  cac_grupo_vip numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, mes, ano)
);
ALTER TABLE public.kpi_cac_canal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cac kpis" ON public.kpi_cac_canal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cac kpis" ON public.kpi_cac_canal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cac kpis" ON public.kpi_cac_canal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cac kpis" ON public.kpi_cac_canal FOR DELETE USING (auth.uid() = user_id);
