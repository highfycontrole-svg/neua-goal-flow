import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const metaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
  valor_meta: z.number().positive('Valor deve ser positivo'),
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2100),
});

interface CreateMetaDialogProps {
  tipo: 'meta' | 'super_meta';
  onSuccess: () => void;
  setores: Array<{ id: string; nome: string }>;
  superMetas?: Array<{ id: string; nome: string }>;
}

export function CreateMetaDialog({ tipo, onSuccess, setores, superMetas }: CreateMetaDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor_meta: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    setor_id: '',
    super_meta_id: '',
    prioridade: 'Média',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = metaSchema.parse({
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        valor_meta: parseFloat(formData.valor_meta),
        mes: formData.mes,
        ano: formData.ano,
      });

      const data: any = {
        ...validated,
        user_id: user?.id,
        setor_id: formData.setor_id,
        valor_realizado: 0,
        status: false,
      };

      if (tipo === 'super_meta') {
        data.prioridade = formData.prioridade;
      } else if (formData.super_meta_id) {
        data.super_meta_id = formData.super_meta_id;
      }

      const { error } = await supabase
        .from(tipo === 'meta' ? 'metas' : 'super_metas')
        .insert([data]);

      if (error) throw error;

      toast.success(`${tipo === 'meta' ? 'Meta' : 'Super Meta'} criada com sucesso!`);
      setOpen(false);
      onSuccess();
      setFormData({
        nome: '',
        descricao: '',
        valor_meta: '',
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        setor_id: '',
        super_meta_id: '',
        prioridade: 'Média',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Erro ao criar meta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova {tipo === 'meta' ? 'Meta' : 'Super Meta'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar {tipo === 'meta' ? 'Meta' : 'Super Meta'}</DialogTitle>
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
            <Label htmlFor="valor_meta">Valor da Meta *</Label>
            <Input
              id="valor_meta"
              type="number"
              step="0.01"
              value={formData.valor_meta}
              onChange={(e) => setFormData({ ...formData, valor_meta: e.target.value })}
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

          {tipo === 'meta' && superMetas && superMetas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="super_meta">Super Meta (opcional)</Label>
              <Select
                value={formData.super_meta_id}
                onValueChange={(value) => setFormData({ ...formData, super_meta_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma super meta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {superMetas.map((sm) => (
                    <SelectItem key={sm.id} value={sm.id}>
                      {sm.nome}
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando...' : 'Criar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
