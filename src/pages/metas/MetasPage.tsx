import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { KPICard } from '@/components/KPICard';
import { CreateMetaDialog } from '@/components/CreateMetaDialog';
import { EditMetaDialog } from '@/components/EditMetaDialog';
import { Target, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const QUARTERS = [
  { id: 'all', label: 'Todos', months: [] as number[] },
  { id: 'q1', label: 'Q1', months: [1, 2, 3] },
  { id: 'q2', label: 'Q2', months: [4, 5, 6] },
  { id: 'q3', label: 'Q3', months: [7, 8, 9] },
  { id: 'q4', label: 'Q4', months: [10, 11, 12] },
];

export default function MetasPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Array<{ id: string; nome: string }>>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [filters, setFilters] = useState({
    ano: new Date().getFullYear(),
    mes: 0,
    setor: '',
    prioridade: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    concluidas: 0,
    emAndamento: 0,
    percentual: 0
  });

  useEffect(() => {
    if (user) {
      loadSetores();
      loadMetas();
    }
  }, [user, filters]);

  const loadSetores = async () => {
    const { data, error } = await supabase.from('setores').select('id, nome');
    if (!error && data) {
      setSetores(data);
    }
  };

  const loadMetas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('metas')
        .select('*, setores(nome)')
        .eq('user_id', user?.id);

      if (filters.ano) query = query.eq('ano', filters.ano);
      if (filters.mes) query = query.eq('mes', filters.mes);
      if (filters.setor) query = query.eq('setor_id', filters.setor);
      if (filters.prioridade) query = query.eq('prioridade', filters.prioridade);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      setMetas(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const concluidas = data?.filter(m => m.status).length || 0;
      const emAndamento = total - concluidas;
      const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

      setStats({ total, concluidas, emAndamento, percentual });
    } catch (error: any) {
      toast.error('Erro ao carregar metas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('metas')
      .update({ status: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Status atualizado');
      loadMetas();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    const { error } = await supabase.from('metas').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir meta');
    } else {
      toast.success('Meta excluída');
      loadMetas();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'destructive';
      case 'Média': return 'default';
      case 'Baixa': return 'secondary';
      default: return 'outline';
    }
  };

  // Filter by selected quarter
  const quarterMonths = QUARTERS.find(q => q.id === selectedQuarter)?.months || [];
  const filteredByQuarter = quarterMonths.length > 0 
    ? metas.filter(m => quarterMonths.includes(m.mes))
    : metas;

  // Chart data by sector
  const chartDataBySector = setores.map(setor => ({
    name: setor.nome,
    total: filteredByQuarter.filter(m => m.setor_id === setor.id).length,
    concluidas: filteredByQuarter.filter(m => m.setor_id === setor.id && m.status).length
  })).filter(d => d.total > 0);

  // Pie chart data by priority
  const pieDataByPriority = [
    { name: 'Alta', value: filteredByQuarter.filter(m => m.prioridade === 'Alta').length, color: '#EF4444' },
    { name: 'Média', value: filteredByQuarter.filter(m => m.prioridade === 'Média').length, color: '#F59E0B' },
    { name: 'Baixa', value: filteredByQuarter.filter(m => m.prioridade === 'Baixa').length, color: '#10B981' }
  ].filter(d => d.value > 0);

  // Stats for filtered quarter
  const quarterStats = {
    total: filteredByQuarter.length,
    concluidas: filteredByQuarter.filter(m => m.status).length,
    emAndamento: filteredByQuarter.filter(m => !m.status).length,
    percentual: filteredByQuarter.length > 0 ? Math.round((filteredByQuarter.filter(m => m.status).length / filteredByQuarter.length) * 100) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Metas</h1>
        <p className="text-muted-foreground">Gerencie e acompanhe todas as suas metas.</p>
      </div>

      {/* Quarterly Tabs */}
      <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter}>
        <TabsList className="grid grid-cols-5 w-full max-w-lg">
          {QUARTERS.map(q => (
            <TabsTrigger key={q.id} value={q.id}>{q.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total de Metas" value={quarterStats.total} icon={Target} description={selectedQuarter === 'all' ? 'Metas cadastradas' : `Metas no ${selectedQuarter.toUpperCase()}`} />
        <KPICard title="Concluídas" value={quarterStats.concluidas} icon={CheckCircle} description="Metas finalizadas" />
        <KPICard title="Em Andamento" value={quarterStats.emAndamento} icon={TrendingUp} description="Metas pendentes" />
        <KPICard title="Taxa de Conclusão" value={`${quarterStats.percentual}%`} icon={Award} description="Percentual concluído" />
      </div>

      {/* Filters */}
      <div className="card-neua p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filters.ano.toString()} onValueChange={value => setFilters({ ...filters, ano: parseInt(value) })}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.mes.toString()} onValueChange={value => setFilters({ ...filters, mes: parseInt(value) })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todos</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.setor || 'all'} onValueChange={value => setFilters({ ...filters, setor: value === 'all' ? '' : value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Todos setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {setores.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.prioridade || 'all'} onValueChange={value => setFilters({ ...filters, prioridade: value === 'all' ? '' : value })}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setFilters({ ano: new Date().getFullYear(), mes: 0, setor: '', prioridade: '' })}>
              Limpar
            </Button>
          </div>

          <CreateMetaDialog tipo="meta" onSuccess={loadMetas} setores={setores} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - By Sector */}
        <div className="card-neua p-6">
          <h3 className="text-lg font-semibold mb-4">Metas por Setor</h3>
          {chartDataBySector.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataBySector}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="concluidas" name="Concluídas" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Pie Chart - By Priority */}
        <div className="card-neua p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Prioridade</h3>
          {pieDataByPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieDataByPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieDataByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-neua p-6">
        <h3 className="text-lg font-semibold mb-4">Lista de Metas</h3>
        {filteredByQuarter.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Realizado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredByQuarter.map((meta) => (
                  <TableRow key={meta.id} className={meta.status ? 'opacity-60' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={meta.status}
                        onCheckedChange={() => handleToggleStatus(meta.id, meta.status)}
                      />
                    </TableCell>
                    <TableCell className={meta.status ? 'line-through' : ''}>
                      {meta.nome}
                    </TableCell>
                    <TableCell>{meta.setores?.nome}</TableCell>
                    <TableCell>{meta.valor_meta}</TableCell>
                    <TableCell>{meta.valor_realizado || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(meta.prioridade) as any}>
                        {meta.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(2000, meta.mes - 1).toLocaleString('pt-BR', { month: 'short' })}/{meta.ano}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingItem(meta)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(meta.id)}>
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="Nenhuma meta encontrada"
            description="Crie sua primeira meta usando o botão acima"
          />
        )}
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <EditMetaDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          meta={editingItem}
          tipo="meta"
          onSuccess={() => {
            setEditingItem(null);
            loadMetas();
          }}
          setores={setores}
        />
      )}
    </div>
  );
}
