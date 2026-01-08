import { useState } from "react";
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
import { Plus, Pencil, Trash2, Search, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";

const ORIGENS = ["E-commerce Neua", "Marketplace", "Venda Direta", "Outros"];
const FORMAS_RECEBIMENTO = ["PIX", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Transferência"];
const STATUS_OPTIONS = ["recebido", "a_receber"];

interface Receita {
  id: string;
  data: string;
  origem: string;
  pedido_id: string | null;
  valor_bruto: number;
  taxas: number;
  valor_liquido: number;
  forma_recebimento: string | null;
  status: string;
  descricao: string | null;
}

export function ReceitasList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    data: format(new Date(), "yyyy-MM-dd"),
    origem: "E-commerce Neua",
    valor_bruto: "",
    taxas: "",
    forma_recebimento: "",
    status: "a_receber",
    descricao: "",
  });

  const { data: receitas = [], isLoading } = useQuery({
    queryKey: ["receitas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Receita[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user?.id,
        data: formData.data,
        origem: formData.origem,
        valor_bruto: parseFloat(formData.valor_bruto) || 0,
        taxas: parseFloat(formData.taxas) || 0,
        forma_recebimento: formData.forma_recebimento || null,
        status: formData.status,
        descricao: formData.descricao || null,
      };

      if (editingReceita) {
        const { error } = await supabase
          .from("receitas")
          .update(payload)
          .eq("id", editingReceita.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receitas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"] });
      toast.success(editingReceita ? "Receita atualizada" : "Receita criada");
      closeDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar receita");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receitas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"] });
      toast.success("Receita excluída");
    },
    onError: () => {
      toast.error("Erro ao excluir receita");
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingReceita(null);
    setFormData({
      data: format(new Date(), "yyyy-MM-dd"),
      origem: "E-commerce Neua",
      valor_bruto: "",
      taxas: "",
      forma_recebimento: "",
      status: "a_receber",
      descricao: "",
    });
  };

  const openEdit = (receita: Receita) => {
    setEditingReceita(receita);
    setFormData({
      data: receita.data,
      origem: receita.origem,
      valor_bruto: receita.valor_bruto.toString(),
      taxas: receita.taxas.toString(),
      forma_recebimento: receita.forma_recebimento || "",
      status: receita.status,
      descricao: receita.descricao || "",
    });
    setDialogOpen(true);
  };

  const filteredReceitas = receitas.filter((r) =>
    r.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBruto = filteredReceitas.reduce((acc, r) => acc + Number(r.valor_bruto), 0);
  const totalLiquido = filteredReceitas.reduce((acc, r) => acc + Number(r.valor_liquido), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleExport = () => {
    const exportData = filteredReceitas.map((r) => ({
      Data: format(new Date(r.data), "dd/MM/yyyy"),
      Origem: r.origem,
      "Valor Bruto": r.valor_bruto,
      Taxas: r.taxas,
      "Valor Líquido": r.valor_liquido,
      "Forma Recebimento": r.forma_recebimento || "-",
      Status: r.status === "recebido" ? "Recebido" : "A Receber",
      Descrição: r.descricao || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Receitas");
    XLSX.writeFile(wb, "receitas.xlsx");
    toast.success("Relatório exportado");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Total Bruto</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalBruto)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Total Líquido</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalLiquido)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar receitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Receita
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Taxas</TableHead>
              <TableHead>Valor Líquido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReceitas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma receita encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceitas.map((receita) => (
                  <motion.tr
                    key={receita.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border"
                  >
                    <TableCell>{format(new Date(receita.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{receita.origem}</TableCell>
                    <TableCell className="text-green-400">{formatCurrency(receita.valor_bruto)}</TableCell>
                    <TableCell className="text-red-400">-{formatCurrency(receita.taxas)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(receita.valor_liquido)}</TableCell>
                    <TableCell>
                      <Badge variant={receita.status === "recebido" ? "default" : "secondary"}>
                        {receita.status === "recebido" ? "Recebido" : "A Receber"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(receita)}>
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
                              <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(receita.id)}
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
            <DialogTitle>{editingReceita ? "Editar Receita" : "Nova Receita"}</DialogTitle>
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
                <Label>Origem</Label>
                <Select value={formData.origem} onValueChange={(v) => setFormData({ ...formData, origem: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Bruto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_bruto}
                  onChange={(e) => setFormData({ ...formData, valor_bruto: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Taxas</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.taxas}
                  onChange={(e) => setFormData({ ...formData, taxas: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Recebimento</Label>
                <Select value={formData.forma_recebimento} onValueChange={(v) => setFormData({ ...formData, forma_recebimento: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_RECEBIMENTO.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_receber">A Receber</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional"
              />
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
