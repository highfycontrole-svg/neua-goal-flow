-- Remover constraint de foreign key antiga e adicionar nova estrutura
-- Super meta agora referencia meta (não o contrário)

-- Remover a foreign key antiga de metas -> super_metas
ALTER TABLE metas DROP COLUMN IF EXISTS super_meta_id;

-- Adicionar coluna meta_id em super_metas
ALTER TABLE super_metas ADD COLUMN IF NOT EXISTS meta_id uuid REFERENCES metas(id) ON DELETE SET NULL;

-- Alterar campos de valor para text (suportar texto livre)
ALTER TABLE metas ALTER COLUMN valor_meta TYPE text;
ALTER TABLE metas ALTER COLUMN valor_realizado TYPE text;
ALTER TABLE metas ALTER COLUMN valor_realizado SET DEFAULT '';

ALTER TABLE super_metas ALTER COLUMN valor_meta TYPE text;
ALTER TABLE super_metas ALTER COLUMN valor_realizado TYPE text;
ALTER TABLE super_metas ALTER COLUMN valor_realizado SET DEFAULT '';

-- Adicionar campo tipo para identificar se é numérico, texto, percentual, etc
ALTER TABLE metas ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'numero' CHECK (tipo IN ('numero', 'texto', 'percentual', 'moeda'));
ALTER TABLE super_metas ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'numero' CHECK (tipo IN ('numero', 'texto', 'percentual', 'moeda'));

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_super_metas_meta_id ON super_metas(meta_id);