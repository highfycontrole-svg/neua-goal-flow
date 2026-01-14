-- Tabela de Packs (narrativas/ângulos criativos)
CREATE TABLE public.ad_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  insight_central TEXT,
  promessa_principal TEXT,
  status TEXT NOT NULL DEFAULT 'ideia',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Anúncios
CREATE TABLE public.ad_anuncios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_id UUID NOT NULL REFERENCES public.ad_packs(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  insight_especifico TEXT,
  gancho_principal TEXT,
  formato TEXT NOT NULL DEFAULT 'video_ugc',
  roteiro_visual JSONB DEFAULT '[]'::jsonb,
  copy_anuncio TEXT,
  link_referencia TEXT,
  observacoes TEXT,
  status_producao TEXT NOT NULL DEFAULT 'ideia',
  status_performance TEXT,
  aprendizado_funcionou TEXT,
  aprendizado_nao_funcionou TEXT,
  aprendizado_recomendacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_anuncios ENABLE ROW LEVEL SECURITY;

-- Políticas para ad_packs
CREATE POLICY "Usuários podem ver seus próprios packs" ON public.ad_packs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar seus próprios packs" ON public.ad_packs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios packs" ON public.ad_packs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios packs" ON public.ad_packs FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ad_anuncios
CREATE POLICY "Usuários podem ver seus próprios anúncios" ON public.ad_anuncios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar seus próprios anúncios" ON public.ad_anuncios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios anúncios" ON public.ad_anuncios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios anúncios" ON public.ad_anuncios FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_ad_packs_updated_at BEFORE UPDATE ON public.ad_packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ad_anuncios_updated_at BEFORE UPDATE ON public.ad_anuncios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();