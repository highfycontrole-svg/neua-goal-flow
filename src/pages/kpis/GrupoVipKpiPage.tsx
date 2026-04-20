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
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
import { formatCurrency } from "@/lib/utils";
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function GrupoVipKpiPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const weekOptions = getWeekOptions(8);
  const [selectedWeek, setSelectedWeek] = useState(weekOptions[0].value);
  const [form, setForm] = useState({
    investimento: 0, total_membros: 0, novos_membros: 0, mensagens_enviadas: 0,
    cliques_links: 0, vendas_atribuidas: 0, receita_atribuida: 0, notas: '',
  });

  const { data: allData = [] } = useQuery({
    queryKey: ['kpi-grupo-vip-all', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_grupo_vip' as any).select('*')
        .order('semana_inicio', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  const { data: currentData } = useQuery({
    queryKey: ['kpi-grupo-vip-week', user?.id, selectedWeek],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_grupo_vip' as any).select('*')
        .eq('semana_inicio', selectedWeek).maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (currentData) {
      setForm({
        investimento: Number(currentData.investimento) || 0,
        total_membros: currentData.total_membros || 0,
        novos_membros: currentData.novos_membros || 0,
        mensagens_enviadas: currentData.mensagens_enviadas || 0,
        cliques_links: currentData.cliques_links || 0,
        vendas_atribuidas: currentData.vendas_atribuidas || 0,
        receita_atribuida: Number(currentData.receita_atribuida) || 0,
        notas: currentData.notas || '',
      });
    } else {
      setForm({ investimento: 0, total_membros: 0, novos_membros: 0, mensagens_enviadas: 0, cliques_links: 0, vendas_atribuidas: 0, receita_atribuida: 0, notas: '' });
    }
  }, [currentData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('kpi_grupo_vip' as any).upsert({
        user_id: user!.id, semana_inicio: selectedWeek, ...form, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,semana_inicio' } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dados salvos!');
      queryClient.invalidateQueries({ queryKey: ['kpi-grupo-vip'] });
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kpi_grupo_vip' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Registro excluído');
      queryClient.invalidateQueries({ queryKey: ['kpi-grupo-vip'] });
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  const chartData = allData.slice(0, 12).reverse().map((h: any) => ({
    semana: format(new Date(h.semana_inicio + 'T12:00:00'), 'dd/MM'),
    membros: h.total_membros || 0,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/kpis')}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Grupo VIP — Registro Semanal</h1>
          <p className="text-sm text-muted-foreground">Registre e acompanhe métricas do Grupo VIP</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border/30">
          <h3 className="text-sm font-semibold mb-4">Evolução de Membros</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="membros" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>{weekOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { l: 'Investimento (R$)', k: 'investimento' as const },
          { l: 'Total Membros', k: 'total_membros' as const },
          { l: 'Novos Membros', k: 'novos_membros' as const },
          { l: 'Mensagens Enviadas', k: 'mensagens_enviadas' as const },
          { l: 'Cliques em Links', k: 'cliques_links' as const },
          { l: 'Vendas Atribuídas', k: 'vendas_atribuidas' as const },
          { l: 'Receita (R$)', k: 'receita_atribuida' as const },
        ].map(f => (
          <div key={f.k}>
            <label className="text-sm text-muted-foreground mb-1 block">{f.l}</label>
            <Input type="number" value={form[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: Number(e.target.value) }))} />
          </div>
        ))}
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
            {['Semana', 'Invest.', 'Membros', 'Novos', 'Msgs', 'Cliques', 'Vendas', 'Receita', ''].map(h => (
              <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>{allData.map((h: any) => (
            <tr key={h.id} className="border-b border-border/20">
              <td className="px-3 py-2">{format(new Date(h.semana_inicio + 'T12:00:00'), 'dd/MM/yy')}</td>
              <td className="px-3 py-2">{formatCurrency(Number(h.investimento))}</td>
              <td className="px-3 py-2">{h.total_membros}</td>
              <td className="px-3 py-2">{h.novos_membros}</td>
              <td className="px-3 py-2">{h.mensagens_enviadas}</td>
              <td className="px-3 py-2">{h.cliques_links}</td>
              <td className="px-3 py-2">{h.vendas_atribuidas}</td>
              <td className="px-3 py-2">{formatCurrency(Number(h.receita_atribuida))}</td>
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
