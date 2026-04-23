import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Search, TrendingDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FinanceiroExportButton } from "./FinanceiroExportButton";
import { formatCurrency } from "@/lib/utils";

const CATEGORIAS = [
  "Marketing",
  "Tráfego pago",
  "Influenciadores",
  "Logística",
  "Produto / Fornecedor",
  "Dropshipping",
  "Estoque próprio",
  "Plataforma / SaaS",
  "Operacional",
  "Impostos",
  "Financeiro",
  "Outros",
];

const FORMAS_PAGAMENTO = ["PIX", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Transferência", "Dinheiro"];

interface Despesa {
  id: string;
  data: string;
  categoria: string;
  subcategoria: string | null;
  descricao: string | null;
  valor: number;
  recorrente: boolean;
  forma_pagamento: string | null;
  canal: string | null;
}

export function DespesasList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    data: format(new Date(), "yyyy-MM-dd"),
    categoria: "Marketing",
    subcategoria: "",
    descricao: "",
    valor: "",
    recorrente: false,
    forma_pagamento: "",
    canal: "",
  });

  const { data: despesas = [], isLoading } = useQuery({
    queryKey: ["despesas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Despesa[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user?.id,
        data: formData.data,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || null,
        descricao: formData.descricao || null,
        valor: parseFloat(formData.valor) || 0,
        recorrente: formData.recorrente,
        forma_pagamento: formData.forma_pagamento || null,
        canal: formData.canal || null,
      };

      if (editingDespesa) {
        const { error } = await supabase
          .from("despesas")
          .update(payload)
          .eq("id", editingDespesa.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("despesas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success(editingDespesa ? "Despesa atualizada" : "Despesa criada");
      closeDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar despesa");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success("Despesa excluída");
    },
    onError: () => {
      toast.error("Erro ao excluir despesa");
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDespesa(null);
    setFormData({
      data: format(new Date(), "yyyy-MM-dd"),
      categoria: "Marketing",
      subcategoria: "",
      descricao: "",
      valor: "",
      recorrente: false,
      forma_pagamento: "",
      canal: "",
    });
  };

  const openEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setFormData({
      data: despesa.data,
      categoria: despesa.categoria,
      subcategoria: despesa.subcategoria || "",
      descricao: despesa.descricao || "",
      valor: despesa.valor.toString(),
      recorrente: despesa.recorrente,
      forma_pagamento: despesa.forma_pagamento || "",
      canal: despesa.canal || "",
    });
    setDialogOpen(true);
  };

  const filteredDespesas = despesas.filter((d) => {
    const matchesSearch = 
      d.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "all" || d.categoria === filterCategoria;
    const matchesFrom = !dateFrom || d.data >= dateFrom;
    const matchesTo = !dateTo || d.data <= dateTo;
    return matchesSearch && matchesCategoria && matchesFrom && matchesTo;
  });

  const totalDespesas = filteredDespesas.reduce((acc, d) => acc + Number(d.valor), 0);
  const despesasRecorrentes = filteredDespesas.filter(d => d.recorrente).reduce((acc, d) => acc + Number(d.valor), 0);

  const generateTextReport = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    return `💸 RELATÓRIO DE DESPESAS
📅 Data: ${dateStr}

📊 RESUMO
━━━━━━━━━━━━━━━━━━━━
• Total Despesas: ${formatCurrency(totalDespesas)}
• Custos Fixos (Recorrentes): ${formatCurrency(despesasRecorrentes)}
• Registros: ${filteredDespesas.length}

📋 ÚLTIMAS DESPESAS
━━━━━━━━━━━━━━━━━━━━
${filteredDespesas.slice(0, 5).map(d => `• ${format(new Date(d.data + "T12:00:00"), "dd/MM/yyyy")} - ${d.categoria}: ${formatCurrency(d.valor)}`).join('\n')}

💡 Relatório gerado automaticamente pela Neua`;
  };

  const xlsData = {
    headers: ['Data', 'Categoria', 'Subcategoria', 'Descrição', 'Valor', 'Recorrente', 'Forma Pagamento'],
    rows: filteredDespesas.map((d) => [
      format(new Date(d.data + "T12:00:00"), "dd/MM/yyyy"),
      d.categoria,
      d.subcategoria || "-",
      d.descricao || "-",
      d.valor,
      d.recorrente ? "Sim" : "Não",
      d.forma_pagamento || "-",
    ]) as (string | number)[][],
    sheetName: 'Despesas'
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      "Marketing": "bg-blue-500/20 text-blue-400",
      "Tráfego pago": "bg-purple-500/20 text-purple-400",
      "Influenciadores": "bg-pink-500/20 text-pink-400",
      "Logística": "bg-orange-500/20 text-orange-400",
      "Produto / Fornecedor": "bg-green-500/20 text-green-400",
      "Dropshipping": "bg-cyan-500/20 text-cyan-400",
      "Impostos": "bg-red-500/20 text-red-400",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm">Total Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm">Custos Fixos (Recorrentes)</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(despesasRecorrentes)}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <FinanceiroExportButton
            containerRef={containerRef}
            sectionName="despesas"
            textReport={generateTextReport()}
            xlsData={xlsData}
          />
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Despesa
          </Button>
        </div>
      </div>

      {/* Filtro de Data */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
        </div>
        {(dateFrom || dateTo) && (
          <Button variant="outline" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
            Limpar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Recorrente</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDespesas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma despesa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredDespesas.map((despesa) => (
                  <motion.tr
                    key={despesa.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border"
                  >
                    <TableCell>{format(new Date(despesa.data + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={getCategoriaColor(despesa.categoria)} variant="outline">
                        {despesa.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>{despesa.descricao || "-"}</TableCell>
                    <TableCell className="text-red-400 font-medium">{formatCurrency(despesa.valor)}</TableCell>
                    <TableCell>
                      {despesa.recorrente ? (
                        <Badge variant="secondary">Sim</Badge>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(despesa)}>
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
                              <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(despesa.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDespesa ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subcategoria</Label>
                <Input
                  value={formData.subcategoria}
                  onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da despesa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento} onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canal Relacionado</Label>
                <Input
                  value={formData.canal}
                  onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked as boolean })}
              />
              <Label htmlFor="recorrente" className="font-normal">Despesa recorrente (custo fixo)</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
