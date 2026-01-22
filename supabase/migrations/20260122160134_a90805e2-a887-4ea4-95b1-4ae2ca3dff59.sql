-- Remover a constraint NOT NULL e FK de produto_id para permitir packs de catálogo institucional
ALTER TABLE public.ad_packs DROP CONSTRAINT IF EXISTS ad_packs_produto_id_fkey;
ALTER TABLE public.ad_packs ALTER COLUMN produto_id DROP NOT NULL;

-- Adicionar FK novamente mas permitindo NULL (ON DELETE SET NULL para packs de catálogo)
ALTER TABLE public.ad_packs ADD CONSTRAINT ad_packs_produto_id_fkey 
  FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;