import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, Pencil, Trash2, ExternalLink, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CreatePedidoDialog } from "./CreatePedidoDialog";
import { EditPedidoDialog } from "./EditPedidoDialog";
import { ImportPedidosDialog } from "./ImportPedidosDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";

interface Pedido {
  id: string;
  numero_pedido: string;
  codigos_rastreio: string[];
  status: string;
  transportadora: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  "Entregue",
  "Negado",
  "Em trânsito BR",
  "Enviado",
  "Recolhido",
  "Aguardando Envio",
  "Reenvio",
  "SEM RASTREIO",
];

const TRANSPORTADORAS = ["ANJUN", "STARLINK", "WSH"];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    "Entregue": "bg-green-500/20 text-green-400 border-green-500/30",
    "Negado": "bg-red-500/20 text-red-400 border-red-500/30",
    "Em trânsito BR": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Enviado": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Recolhido": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Aguardando Envio": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Reenvio": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "SEM RASTREIO": "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

export function PedidosList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTransportadora, setFilterTransportadora] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pedidos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido excluído com sucesso");
    },
    onError: () => {
      toast.error("Erro ao excluir pedido");
    },
  });

  const filteredPedidos = pedidos.filter((pedido) => {
    const matchesStatus = filterStatus === "all" || pedido.status === filterStatus;
    const matchesTransportadora = filterTransportadora === "all" || pedido.transportadora === filterTransportadora;
    const matchesSearch = searchTerm === "" || 
      pedido.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.codigos_rastreio.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesTransportadora && matchesSearch;
  });

  const handleExport = (format: "csv" | "xlsx") => {
    const exportData = filteredPedidos.map((p) => ({
      "Nº Pedido": p.numero_pedido,
      "Status": p.status,
      "Transportadora": p.transportadora || "-",
      "Data Criação": new Date(p.created_at).toLocaleDateString("pt-BR"),
      "Data Atualização": new Date(p.updated_at).toLocaleDateString("pt-BR"),
      "Códigos de Rastreio": p.codigos_rastreio.join(", "),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    if (format === "csv") {
      XLSX.writeFile(wb, "pedidos.csv");
    } else {
      XLSX.writeFile(wb, "pedidos.xlsx");
    }

    toast.success(`Relatório exportado em ${format.toUpperCase()}`);
  };

  const generateTrackingLink = (codigo: string) => {
    return `https://t.17track.net/pt#nums=${codigo}`;
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Pedido
        </Button>
        <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Planilha
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")} className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("xlsx")} className="gap-2">
            <Download className="h-4 w-4" />
            XLSX
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº pedido ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTransportadora} onValueChange={setFilterTransportadora}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Transportadora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {TRANSPORTADORAS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Transportadora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Códigos de Rastreio</TableHead>
              <TableHead>Links</TableHead>
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
              ) : filteredPedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPedidos.map((pedido) => (
                  <motion.tr
                    key={pedido.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border-b border-border"
                  >
                    <TableCell className="font-medium">{pedido.numero_pedido}</TableCell>
                    <TableCell>{pedido.transportadora || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(pedido.status)} variant="outline">
                        {pedido.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pedido.codigos_rastreio.length > 0 ? (
                          pedido.codigos_rastreio.map((codigo, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {codigo}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pedido.codigos_rastreio.map((codigo, i) => (
                          <a
                            key={i}
                            href={generateTrackingLink(codigo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {i + 1}
                          </a>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPedido(pedido);
                            setEditDialogOpen(true);
                          }}
                        >
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
                              <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O pedido será permanentemente removido.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(pedido.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* Dialogs */}
      <CreatePedidoDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditPedidoDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        pedido={selectedPedido}
      />
      <ImportPedidosDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
}
