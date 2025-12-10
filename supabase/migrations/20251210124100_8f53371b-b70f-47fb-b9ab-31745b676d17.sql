-- Criar tabela de variantes de produtos
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  foto_url TEXT,
  preco_custo NUMERIC NOT NULL DEFAULT 0,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para variantes - baseadas no dono do produto
CREATE POLICY "Usuários podem ver variantes de seus produtos" 
ON public.product_variants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.produtos 
  WHERE produtos.id = product_variants.product_id 
  AND produtos.user_id = auth.uid()
));

CREATE POLICY "Usuários podem criar variantes em seus produtos" 
ON public.product_variants 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.produtos 
  WHERE produtos.id = product_variants.product_id 
  AND produtos.user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar variantes de seus produtos" 
ON public.product_variants 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.produtos 
  WHERE produtos.id = product_variants.product_id 
  AND produtos.user_id = auth.uid()
));

CREATE POLICY "Usuários podem deletar variantes de seus produtos" 
ON public.product_variants 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.produtos 
  WHERE produtos.id = product_variants.product_id 
  AND produtos.user_id = auth.uid()
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna order_index para workspace_tasks para ordenação
ALTER TABLE public.workspace_tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Adicionar coluna order_index para workspace_subtasks para ordenação
ALTER TABLE public.workspace_subtasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;