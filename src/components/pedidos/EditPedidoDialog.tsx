import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

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

const STATUS_ENTREGA_OPTIONS = ["Excelente", "Prazo", "Ruim", "Péssimo"];

const TRANSPORTADORAS_PADRAO = ["ANJUN", "STARLINK", "WSH"];

interface Pedido {
  id: string;
  numero_pedido: string;
  codigos_rastreio: string[];
  status: string;
  transportadora: string | null;
  prazo_entrega: number | null;
  status_entrega: string | null;
}

interface EditPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: Pedido | null;
}

export function EditPedidoDialog({ open, onOpenChange, pedido }: EditPedidoDialogProps) {
  const queryClient = useQueryClient();
  const [numeroPedido, setNumeroPedido] = useState("");
  const [codigosRastreio, setCodigosRastreio] = useState<string[]>([""]);
  const [status, setStatus] = useState("Aguardando Envio");
  const [transportadora, setTransportadora] = useState("");
  const [novaTransportadora, setNovaTransportadora] = useState("");
  const [transportadoras, setTransportadoras] = useState(TRANSPORTADORAS_PADRAO);
  const [prazoEntrega, setPrazoEntrega] = useState<string>("");
  const [statusEntrega, setStatusEntrega] = useState<string>("");

  useEffect(() => {
    if (pedido) {
      setNumeroPedido(pedido.numero_pedido);
      setCodigosRastreio(pedido.codigos_rastreio.length > 0 ? pedido.codigos_rastreio : [""]);
      setStatus(pedido.status);
      setTransportadora(pedido.transportadora || "");
      setPrazoEntrega(pedido.prazo_entrega?.toString() || "");
      setStatusEntrega(pedido.status_entrega || "");
      
      // Add transportadora to list if it's custom
      if (pedido.transportadora && !TRANSPORTADORAS_PADRAO.includes(pedido.transportadora)) {
        setTransportadoras([...TRANSPORTADORAS_PADRAO, pedido.transportadora]);
      }
    }
  }, [pedido]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!pedido) return;
      
      const codigosFiltrados = codigosRastreio.filter((c) => c.trim() !== "");
      
      const { error } = await supabase
        .from("pedidos")
        .update({
          numero_pedido: numeroPedido,
          codigos_rastreio: codigosFiltrados,
          status,
          transportadora: transportadora || null,
          prazo_entrega: prazoEntrega ? parseInt(prazoEntrega) : null,
          status_entrega: statusEntrega || null,
        })
        .eq("id", pedido.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido atualizado com sucesso");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar pedido");
    },
  });

  const addCodigoRastreio = () => {
    setCodigosRastreio([...codigosRastreio, ""]);
  };

  const updateCodigoRastreio = (index: number, value: string) => {
    const updated = [...codigosRastreio];
    updated[index] = value;
    setCodigosRastreio(updated);
  };

  const removeCodigoRastreio = (index: number) => {
    if (codigosRastreio.length > 1) {
      setCodigosRastreio(codigosRastreio.filter((_, i) => i !== index));
    }
  };

  const addNovaTransportadora = () => {
    if (novaTransportadora.trim() && !transportadoras.includes(novaTransportadora.trim())) {
      const nova = novaTransportadora.trim().toUpperCase();
      setTransportadoras([...transportadoras, nova]);
      setTransportadora(nova);
      setNovaTransportadora("");
    }
  };

  const generateTrackingLinks = () => {
    return codigosRastreio
      .filter((c) => c.trim())
      .map((c) => `https://t.17track.net/pt#nums=${c}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroPedido.trim()) {
      toast.error("Número do pedido é obrigatório");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Número do Pedido */}
          <div className="space-y-2">
            <Label htmlFor="numeroPedido">Número do Pedido *</Label>
            <Input
              id="numeroPedido"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="Ex: PED-001"
              required
            />
          </div>

          {/* Códigos de Rastreio */}
          <div className="space-y-2">
            <Label>Códigos de Rastreio</Label>
            <div className="space-y-2">
              {codigosRastreio.map((codigo, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={codigo}
                    onChange={(e) => updateCodigoRastreio(index, e.target.value)}
                    placeholder="Código de rastreio"
                  />
                  {codigosRastreio.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCodigoRastreio(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCodigoRastreio} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar código
            </Button>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transportadora */}
          <div className="space-y-2">
            <Label>Transportadora</Label>
            <Select value={transportadora} onValueChange={setTransportadora}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {transportadoras.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              <Input
                value={novaTransportadora}
                onChange={(e) => setNovaTransportadora(e.target.value)}
                placeholder="Nova transportadora"
              />
              <Button type="button" variant="outline" size="sm" onClick={addNovaTransportadora}>
                Adicionar
              </Button>
            </div>
          </div>

          {/* Prazo de Entrega */}
          <div className="space-y-2">
            <Label htmlFor="prazoEntrega">Prazo de Entrega (dias)</Label>
            <Input
              id="prazoEntrega"
              type="number"
              min="0"
              value={prazoEntrega}
              onChange={(e) => setPrazoEntrega(e.target.value)}
              placeholder="Ex: 7"
            />
          </div>

          {/* Status de Entrega (Qualidade Logística) */}
          <div className="space-y-2">
            <Label>Status de Entrega (Qualidade)</Label>
            <Select value={statusEntrega} onValueChange={setStatusEntrega}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ENTREGA_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Links */}
          {codigosRastreio.some((c) => c.trim()) && (
            <div className="space-y-2">
              <Label>Links de Rastreio (gerados automaticamente)</Label>
              <div className="space-y-1 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                {generateTrackingLinks().map((link, i) => (
                  <div key={i} className="truncate">
                    {link}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
