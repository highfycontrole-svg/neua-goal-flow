import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Megaphone, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FinanceiroExportButton } from "./FinanceiroExportButton";

const PLATAFORMAS = ["Meta Ads", "Google Ads", "TikTok Ads", "Pinterest Ads", "LinkedIn Ads", "Outros"];
const PLATAFORMAS_INFLUENCER = ["Instagram", "TikTok", "YouTube", "Twitter/X", "Pinterest", "Outros"];

interface Campanha {
  id: string;
  plataforma: string;
  nome_campanha: string;
  data_inicio: string;
  data_fim: string | null;
  investimento: number;
  pedidos_gerados: number;
  receita_gerada: number;
  roas: number;
  cpa: number;
  status: string;
}

interface Influenciador {
  id: string;
  nome: string;
  plataforma: string;
  tipo_pagamento: string;
  custo: number;
  pedidos_gerados: number;
  receita_gerada: number;
  roi: number;
  custo_por_pedido: number;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
}

export function MarketingTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("campanhas");

  // Campanhas state
  const [campanhaDialogOpen, setCampanhaDialogOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<Campanha | null>(null);
  const [campanhaForm, setCampanhaForm] = useState({
    plataforma: "Meta Ads",
    nome_campanha: "",
    data_inicio: format(new Date(), "yyyy-MM-dd"),
    data_fim: "",
    investimento: "",
    pedidos_gerados: "",
    receita_gerada: "",
    status: "ativa",
  });

  // Influenciadores state
  const [influenciadorDialogOpen, setInfluenciadorDialogOpen] = useState(false);
  const [editingInfluenciador, setEditingInfluenciador] = useState<Influenciador | null>(null);
  const [influenciadorForm, setInfluenciadorForm] = useState({
    nome: "",
    plataforma: "Instagram",
    tipo_pagamento: "fixo",
    custo: "",
    pedidos_gerados: "",
    receita_gerada: "",
    data_inicio: "",
    data_fim: "",
    status: "ativo",
  });

  // Queries
  const { data: campanhas = [], isLoading: loadingCampanhas } = useQuery({
    queryKey: ["marketing_campanhas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campanhas")
        .select("*")
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Campanha[];
    },
    enabled: !!user?.id,
  });

  const { data: influenciadores = [], isLoading: loadingInfluenciadores } = useQuery({
    queryKey: ["marketing_influenciadores", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_influenciadores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Influenciador[];
    },
    enabled: !!user?.id,
  });

  // Mutations - Campanhas
  const saveCampanhaMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user?.id,
        plataforma: campanhaForm.plataforma,
        nome_campanha: campanhaForm.nome_campanha,
        data_inicio: campanhaForm.data_inicio,
        data_fim: campanhaForm.data_fim || null,
        investimento: parseFloat(campanhaForm.investimento) || 0,
        pedidos_gerados: parseInt(campanhaForm.pedidos_gerados) || 0,
        receita_gerada: parseFloat(campanhaForm.receita_gerada) || 0,
        status: campanhaForm.status,
      };

      if (editingCampanha) {
        const { error } = await supabase.from("marketing_campanhas").update(payload).eq("id", editingCampanha.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marketing_campanhas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_campanhas"] });
      toast.success(editingCampanha ? "Campanha atualizada" : "Campanha criada");
      closeCampanhaDialog();
    },
    onError: () => toast.error("Erro ao salvar campanha"),
  });

  const deleteCampanhaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_campanhas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_campanhas"] });
      toast.success("Campanha excluída");
    },
    onError: () => toast.error("Erro ao excluir campanha"),
  });

  // Mutations - Influenciadores
  const saveInfluenciadorMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user?.id,
        nome: influenciadorForm.nome,
        plataforma: influenciadorForm.plataforma,
        tipo_pagamento: influenciadorForm.tipo_pagamento,
        custo: parseFloat(influenciadorForm.custo) || 0,
        pedidos_gerados: parseInt(influenciadorForm.pedidos_gerados) || 0,
        receita_gerada: parseFloat(influenciadorForm.receita_gerada) || 0,
        data_inicio: influenciadorForm.data_inicio || null,
        data_fim: influenciadorForm.data_fim || null,
        status: influenciadorForm.status,
      };

      if (editingInfluenciador) {
        const { error } = await supabase.from("marketing_influenciadores").update(payload).eq("id", editingInfluenciador.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marketing_influenciadores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_influenciadores"] });
      toast.success(editingInfluenciador ? "Influenciador atualizado" : "Influenciador adicionado");
      closeInfluenciadorDialog();
    },
    onError: () => toast.error("Erro ao salvar influenciador"),
  });

  const deleteInfluenciadorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_influenciadores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_influenciadores"] });
      toast.success("Influenciador excluído");
    },
    onError: () => toast.error("Erro ao excluir influenciador"),
  });

  // Dialog helpers
  const closeCampanhaDialog = () => {
    setCampanhaDialogOpen(false);
    setEditingCampanha(null);
    setCampanhaForm({
      plataforma: "Meta Ads",
      nome_campanha: "",
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      data_fim: "",
      investimento: "",
      pedidos_gerados: "",
      receita_gerada: "",
      status: "ativa",
    });
  };

  const closeInfluenciadorDialog = () => {
    setInfluenciadorDialogOpen(false);
    setEditingInfluenciador(null);
    setInfluenciadorForm({
      nome: "",
      plataforma: "Instagram",
      tipo_pagamento: "fixo",
      custo: "",
      pedidos_gerados: "",
      receita_gerada: "",
      data_inicio: "",
      data_fim: "",
      status: "ativo",
    });
  };

  const openEditCampanha = (c: Campanha) => {
    setEditingCampanha(c);
    setCampanhaForm({
      plataforma: c.plataforma,
      nome_campanha: c.nome_campanha,
      data_inicio: c.data_inicio,
      data_fim: c.data_fim || "",
      investimento: c.investimento.toString(),
      pedidos_gerados: c.pedidos_gerados.toString(),
      receita_gerada: c.receita_gerada.toString(),
      status: c.status,
    });
    setCampanhaDialogOpen(true);
  };

  const openEditInfluenciador = (i: Influenciador) => {
    setEditingInfluenciador(i);
    setInfluenciadorForm({
      nome: i.nome,
      plataforma: i.plataforma,
      tipo_pagamento: i.tipo_pagamento,
      custo: i.custo.toString(),
      pedidos_gerados: i.pedidos_gerados.toString(),
      receita_gerada: i.receita_gerada.toString(),
      data_inicio: i.data_inicio || "",
      data_fim: i.data_fim || "",
      status: i.status,
    });
    setInfluenciadorDialogOpen(true);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Summary metrics
  const totalInvestido = campanhas.reduce((acc, c) => acc + Number(c.investimento), 0);
  const totalReceitaCampanhas = campanhas.reduce((acc, c) => acc + Number(c.receita_gerada), 0);
  const roasMedio = totalInvestido > 0 ? totalReceitaCampanhas / totalInvestido : 0;
  const totalCustoInfluenciadores = influenciadores.reduce((acc, i) => acc + Number(i.custo), 0);
  const totalReceitaInfluenciadores = influenciadores.reduce((acc, i) => acc + Number(i.receita_gerada), 0);

  const generateTextReport = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    return `📣 RELATÓRIO DE MARKETING
📅 Data: ${dateStr}

🎯 TRÁFEGO PAGO
━━━━━━━━━━━━━━━━━━━━
• Total Investido: ${formatCurrency(totalInvestido)}
• Receita Gerada: ${formatCurrency(totalReceitaCampanhas)}
• ROAS Médio: ${roasMedio.toFixed(2)}x
• Campanhas Ativas: ${campanhas.filter(c => c.status === 'ativa').length}

👥 INFLUENCIADORES
━━━━━━━━━━━━━━━━━━━━
• Custo Total: ${formatCurrency(totalCustoInfluenciadores)}
• Receita Gerada: ${formatCurrency(totalReceitaInfluenciadores)}
• Influenciadores Ativos: ${influenciadores.filter(i => i.status === 'ativo').length}

📋 TOP CAMPANHAS
━━━━━━━━━━━━━━━━━━━━
${campanhas.slice(0, 3).map(c => `• ${c.nome_campanha}: ROAS ${Number(c.roas).toFixed(2)}x`).join('\n')}

💡 Relatório gerado automaticamente pela Neua`;
  };

  const xlsData = {
    headers: ['Tipo', 'Nome', 'Investimento/Custo', 'Receita', 'ROAS/ROI', 'Pedidos', 'Status'],
    rows: [
      ...campanhas.map((c) => [
        'Campanha',
        c.nome_campanha,
        c.investimento,
        c.receita_gerada,
        Number(c.roas).toFixed(2),
        c.pedidos_gerados,
        c.status,
      ]),
      ...influenciadores.map((i) => [
        'Influenciador',
        i.nome,
        i.custo,
        i.receita_gerada,
        Number(i.roi).toFixed(2),
        i.pedidos_gerados,
        i.status,
      ]),
    ] as (string | number)[][],
    sheetName: 'Marketing'
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Marketing & Aquisição</h2>
        <FinanceiroExportButton
          containerRef={containerRef}
          sectionName="marketing"
          textReport={generateTextReport()}
          xlsData={xlsData}
        />
      </div>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Megaphone className="h-4 w-4" />
            <span className="text-sm">Total Investido (Tráfego)</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalInvestido)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">ROAS Médio</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{roasMedio.toFixed(2)}x</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Custo Influenciadores</span>
          </div>
          <p className="text-2xl font-bold text-pink-400">{formatCurrency(totalCustoInfluenciadores)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Receita Influenciadores</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalReceitaInfluenciadores)}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campanhas" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Tráfego Pago
          </TabsTrigger>
          <TabsTrigger value="influenciadores" className="gap-2">
            <Users className="h-4 w-4" />
            Influenciadores
          </TabsTrigger>
        </TabsList>

        {/* Campanhas Tab */}
        <TabsContent value="campanhas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCampanhaDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Campanha
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Investimento</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>ROAS</TableHead>
                  <TableHead>CPA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {loadingCampanhas ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : campanhas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhuma campanha cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    campanhas.map((c) => (
                      <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border">
                        <TableCell>
                          <Badge variant="outline">{c.plataforma}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{c.nome_campanha}</TableCell>
                        <TableCell>{formatCurrency(c.investimento)}</TableCell>
                        <TableCell>{c.pedidos_gerados}</TableCell>
                        <TableCell className="text-green-400">{formatCurrency(c.receita_gerada)}</TableCell>
                        <TableCell className={c.roas >= 2 ? "text-green-400" : c.roas >= 1 ? "text-yellow-400" : "text-red-400"}>
                          {Number(c.roas).toFixed(2)}x
                        </TableCell>
                        <TableCell>{formatCurrency(c.cpa)}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "ativa" ? "default" : "secondary"}>
                            {c.status === "ativa" ? "Ativa" : "Pausada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditCampanha(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCampanhaMutation.mutate(c.id)} className="bg-destructive">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Influenciadores Tab */}
        <TabsContent value="influenciadores" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setInfluenciadorDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Influenciador
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>CPP</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {loadingInfluenciadores ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : influenciadores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum influenciador cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    influenciadores.map((i) => (
                      <motion.tr key={i.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border">
                        <TableCell className="font-medium">{i.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{i.plataforma}</Badge>
                        </TableCell>
                        <TableCell>{i.tipo_pagamento === "fixo" ? "Fixo" : "Comissão"}</TableCell>
                        <TableCell>{formatCurrency(i.custo)}</TableCell>
                        <TableCell>{i.pedidos_gerados}</TableCell>
                        <TableCell className="text-green-400">{formatCurrency(i.receita_gerada)}</TableCell>
                        <TableCell className={i.roi >= 100 ? "text-green-400" : i.roi >= 0 ? "text-yellow-400" : "text-red-400"}>
                          {Number(i.roi).toFixed(0)}%
                        </TableCell>
                        <TableCell>{formatCurrency(i.custo_por_pedido)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditInfluenciador(i)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir influenciador?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteInfluenciadorMutation.mutate(i.id)} className="bg-destructive">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Campanha Dialog */}
      <Dialog open={campanhaDialogOpen} onOpenChange={(open) => !open && closeCampanhaDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampanha ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveCampanhaMutation.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={campanhaForm.plataforma} onValueChange={(v) => setCampanhaForm({ ...campanhaForm, plataforma: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATAFORMAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={campanhaForm.status} onValueChange={(v) => setCampanhaForm({ ...campanhaForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome da Campanha</Label>
              <Input value={campanhaForm.nome_campanha} onChange={(e) => setCampanhaForm({ ...campanhaForm, nome_campanha: e.target.value })} placeholder="Ex: Black Friday 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input type="date" value={campanhaForm.data_inicio} onChange={(e) => setCampanhaForm({ ...campanhaForm, data_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={campanhaForm.data_fim} onChange={(e) => setCampanhaForm({ ...campanhaForm, data_fim: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Investimento</Label>
                <Input type="number" step="0.01" value={campanhaForm.investimento} onChange={(e) => setCampanhaForm({ ...campanhaForm, investimento: e.target.value })} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Pedidos</Label>
                <Input type="number" value={campanhaForm.pedidos_gerados} onChange={(e) => setCampanhaForm({ ...campanhaForm, pedidos_gerados: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Receita</Label>
                <Input type="number" step="0.01" value={campanhaForm.receita_gerada} onChange={(e) => setCampanhaForm({ ...campanhaForm, receita_gerada: e.target.value })} placeholder="0,00" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeCampanhaDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveCampanhaMutation.isPending}>{saveCampanhaMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Influenciador Dialog */}
      <Dialog open={influenciadorDialogOpen} onOpenChange={(open) => !open && closeInfluenciadorDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingInfluenciador ? "Editar Influenciador" : "Novo Influenciador"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveInfluenciadorMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={influenciadorForm.nome} onChange={(e) => setInfluenciadorForm({ ...influenciadorForm, nome: e.target.value })} placeholder="Nome do influenciador" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={influenciadorForm.plataforma} onValueChange={(v) => setInfluenciadorForm({ ...influenciadorForm, plataforma: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATAFORMAS_INFLUENCER.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo Pagamento</Label>
                <Select value={influenciadorForm.tipo_pagamento} onValueChange={(v) => setInfluenciadorForm({ ...influenciadorForm, tipo_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixo">Fixo</SelectItem>
                    <SelectItem value="comissao">Comissão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Custo</Label>
                <Input type="number" step="0.01" value={influenciadorForm.custo} onChange={(e) => setInfluenciadorForm({ ...influenciadorForm, custo: e.target.value })} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Pedidos</Label>
                <Input type="number" value={influenciadorForm.pedidos_gerados} onChange={(e) => setInfluenciadorForm({ ...influenciadorForm, pedidos_gerados: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Receita</Label>
                <Input type="number" step="0.01" value={influenciadorForm.receita_gerada} onChange={(e) => setInfluenciadorForm({ ...influenciadorForm, receita_gerada: e.target.value })} placeholder="0,00" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeInfluenciadorDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveInfluenciadorMutation.isPending}>{saveInfluenciadorMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
