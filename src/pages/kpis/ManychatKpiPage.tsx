import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getWeekOptions } from '@/lib/weekUtils';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
import { formatCurrency } from "@/lib/utils";
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ManychatKpiPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const weekOptions = getWeekOptions(8);
  const [selectedWeek, setSelectedWeek] = useState(weekOptions[0].value);
  const [form, setForm] = useState({
    investimento: 0, disparos: 0, ctr_fluxo: 0, pct_conclusao: 0,
    leads_gerados: 0, vendas_atribuidas: 0, receita_atribuida: 0,
    ponto_abandono: '', notas: '',
  });

  const { data: allData = [] } = useQuery({
    queryKey: ['kpi-manychat-all', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_manychat' as any).select('*')
        .order('semana_inicio', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  const { data: currentData } = useQuery({
    queryKey: ['kpi-manychat-week', user?.id, selectedWeek],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_manychat' as any).select('*')
        .eq('semana_inicio', selectedWeek).maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (currentData) {
      setForm({
        investimento: Number(currentData.investimento) || 0,
        disparos: currentData.disparos || 0,
        ctr_fluxo: Number(currentData.ctr_fluxo) || 0,
        pct_conclusao: Number(currentData.pct_conclusao) || 0,
        leads_gerados: currentData.leads_gerados || 0,
        vendas_atribuidas: currentData.vendas_atribuidas || 0,
        receita_atribuida: Number(currentData.receita_atribuida) || 0,
        ponto_abandono: currentData.ponto_abandono || '',
        notas: currentData.notas || '',
      });
    } else {
      setForm({ investimento: 0, disparos: 0, ctr_fluxo: 0, pct_conclusao: 0, leads_gerados: 0, vendas_atribuidas: 0, receita_atribuida: 0, ponto_abandono: '', notas: '' });
    }
  }, [currentData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('kpi_manychat' as any).upsert({
        user_id: user!.id, semana_inicio: selectedWeek, ...form, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,semana_inicio' } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dados salvos!');
      queryClient.invalidateQueries({ queryKey: ['kpi-manychat'] });
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kpi_manychat' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Registro excluído');
      queryClient.invalidateQueries({ queryKey: ['kpi-manychat'] });
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/kpis')}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold font-display">ManyChat — Registro Semanal</h1>
          <p className="text-sm text-muted-foreground">Registre e acompanhe métricas semanais do ManyChat</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>{weekOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { l: 'Investimento (R$)', k: 'investimento' as const },
          { l: 'Disparos', k: 'disparos' as const },
          { l: 'CTR Fluxo (%)', k: 'ctr_fluxo' as const },
          { l: 'Conclusão (%)', k: 'pct_conclusao' as const },
          { l: 'Leads Gerados', k: 'leads_gerados' as const },
          { l: 'Vendas Atribuídas', k: 'vendas_atribuidas' as const },
          { l: 'Receita (R$)', k: 'receita_atribuida' as const },
        ].map(f => (
          <div key={f.k}>
            <label className="text-sm text-muted-foreground mb-1 block">{f.l}</label>
            <Input type="number" value={form[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: Number(e.target.value) }))} />
          </div>
        ))}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Ponto de Abandono</label>
          <Input value={form.ponto_abandono} onChange={e => setForm(f => ({ ...f, ponto_abandono: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Notas</label>
        <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Salvando...' : 'Salvar Semana'}
      </Button>

      <div className="overflow-x-auto rounded-xl border border-border/30">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/30 bg-card">
            {['Semana', 'Invest.', 'Disparos', 'CTR', 'Conclusão', 'Leads', 'Vendas', 'Receita', 'Abandono', ''].map(h => (
              <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>{allData.map((h: any) => (
            <tr key={h.id} className="border-b border-border/20">
              <td className="px-3 py-2">{format(new Date(h.semana_inicio + 'T12:00:00'), 'dd/MM/yy')}</td>
              <td className="px-3 py-2">{formatCurrency(Number(h.investimento))}</td>
              <td className="px-3 py-2">{h.disparos}</td>
              <td className="px-3 py-2">{Number(h.ctr_fluxo).toFixed(1)}%</td>
              <td className="px-3 py-2">{Number(h.pct_conclusao).toFixed(1)}%</td>
              <td className="px-3 py-2">{h.leads_gerados}</td>
              <td className="px-3 py-2">{h.vendas_atribuidas}</td>
              <td className="px-3 py-2">{formatCurrency(Number(h.receita_atribuida))}</td>
              <td className="px-3 py-2 max-w-[120px] truncate">{h.ponto_abandono || '—'}</td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedWeek(h.semana_inicio)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(h.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </motion.div>
  );
}
