import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const metaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
  valor_meta: z.string().min(1, 'Valor da meta é obrigatório'),
  valor_realizado: z.string(),
  tipo: z.enum(['numero', 'texto', 'percentual', 'moeda']),
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2100),
  status: z.boolean(),
});

interface Meta {
  id: string;
  nome: string;
  descricao?: string;
  valor_meta: string;
  valor_realizado: string;
  tipo: 'numero' | 'texto' | 'percentual' | 'moeda';
  mes: number;
  ano: number;
  setor_id: string;
  status: boolean;
  prioridade?: string;
  meta_id?: string;
}

interface EditMetaDialogProps {
  meta: Meta | null;
  tipo: 'meta' | 'super_meta';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  setores: Array<{ id: string; nome: string }>;
  metas?: Array<{ id: string; nome: string }>;
}

export function EditMetaDialog({ meta, tipo, open, onOpenChange, onSuccess, setores, metas }: EditMetaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor_meta: '',
    valor_realizado: '',
    tipo: 'numero' as 'numero' | 'texto' | 'percentual' | 'moeda',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    setor_id: '',
    meta_id: '',
    prioridade: 'Média',
    status: false,
  });

  useEffect(() => {
    if (meta) {
      setFormData({
        nome: meta.nome,
        descricao: meta.descricao || '',
        valor_meta: meta.valor_meta,
        valor_realizado: meta.valor_realizado,
        tipo: meta.tipo,
        mes: meta.mes,
        ano: meta.ano,
        setor_id: meta.setor_id,
        meta_id: meta.meta_id || '',
        prioridade: meta.prioridade || 'Média',
        status: meta.status,
      });
    }
  }, [meta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meta) return;
    
    setLoading(true);

    try {
      const validated = metaSchema.parse({
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        valor_meta: formData.valor_meta,
        valor_realizado: formData.valor_realizado,
        tipo: formData.tipo,
        mes: formData.mes,
        ano: formData.ano,
        status: formData.status,
      });

      const data: any = {
        ...validated,
        setor_id: formData.setor_id,
      };

      if (tipo === 'super_meta') {
        data.prioridade = formData.prioridade;
        if (formData.meta_id) {
          data.meta_id = formData.meta_id;
        }
      } else {
        // Metas também têm prioridade agora
        data.prioridade = formData.prioridade;
      }

      const { error } = await supabase
        .from(tipo === 'meta' ? 'metas' : 'super_metas')
        .update(data)
        .eq('id', meta.id);

      if (error) throw error;

      toast.success(`${tipo === 'meta' ? 'Meta' : 'Super Meta'} atualizada com sucesso!`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Erro ao atualizar meta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {tipo === 'meta' ? 'Meta' : 'Super Meta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Meta *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numero">Número</SelectItem>
                <SelectItem value="texto">Texto</SelectItem>
                <SelectItem value="percentual">Percentual</SelectItem>
                <SelectItem value="moeda">Moeda (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_meta">Valor da Meta *</Label>
            <Input
              id="valor_meta"
              type={formData.tipo === 'numero' || formData.tipo === 'percentual' || formData.tipo === 'moeda' ? 'number' : 'text'}
              step={formData.tipo === 'moeda' ? '0.01' : '1'}
              value={formData.valor_meta}
              onChange={(e) => setFormData({ ...formData, valor_meta: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_realizado">Valor Realizado *</Label>
            <Input
              id="valor_realizado"
              type={formData.tipo === 'numero' || formData.tipo === 'percentual' || formData.tipo === 'moeda' ? 'number' : 'text'}
              step={formData.tipo === 'moeda' ? '0.01' : '1'}
              value={formData.valor_realizado}
              onChange={(e) => setFormData({ ...formData, valor_realizado: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mês *</Label>
              <Select
                value={formData.mes.toString()}
                onValueChange={(value) => setFormData({ ...formData, mes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setor">Setor *</Label>
            <Select
              value={formData.setor_id}
              onValueChange={(value) => setFormData({ ...formData, setor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((setor) => (
                  <SelectItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipo === 'super_meta' && metas && metas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="meta">Meta Associada (opcional)</Label>
              <Select
                value={formData.meta_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, meta_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma meta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {metas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipo === 'super_meta' && (
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="status"
              checked={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="status">Meta concluída</Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
