import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportPedidosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  numero_pedido: string;
  codigos_rastreio: string[];
  status: string;
  transportadora: string;
  prazo_entrega: number | null;
  status_entrega: string;
}

export function ImportPedidosDialog({ open, onOpenChange }: ImportPedidosDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    numero_pedido: "",
    codigos_rastreio: "",
    status: "",
    transportadora: "",
    prazo_entrega: "",
    status_entrega: "",
  });
  const [columns, setColumns] = useState<string[]>([]);
  const [conflictMode, setConflictMode] = useState<"overwrite" | "update_empty">("overwrite");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (jsonData.length > 0) {
        const headerRow = jsonData[0].map(String);
        setColumns(headerRow);
        setStep(2);
      }
    } catch (error) {
      toast.error("Erro ao ler o arquivo");
    }
  };

  const handleMappingComplete = async () => {
    if (!file || !columnMapping.numero_pedido) {
      toast.error("Mapeie pelo menos o campo 'Número do Pedido'");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      const parsed: ParsedRow[] = jsonData.map((row) => {
        const codigosRaw = columnMapping.codigos_rastreio
          ? String(row[columnMapping.codigos_rastreio] || "")
          : "";
        
        // Split by common separators
        const codigos = codigosRaw
          .split(/[,;|\n]/)
          .map((c) => c.trim())
          .filter((c) => c);

        return {
          numero_pedido: String(row[columnMapping.numero_pedido] || ""),
          codigos_rastreio: codigos,
          status: columnMapping.status ? String(row[columnMapping.status] || "Aguardando Envio") : "Aguardando Envio",
          transportadora: columnMapping.transportadora ? String(row[columnMapping.transportadora] || "") : "",
          prazo_entrega: columnMapping.prazo_entrega ? (parseInt(String(row[columnMapping.prazo_entrega])) || null) : null,
          status_entrega: columnMapping.status_entrega ? String(row[columnMapping.status_entrega] || "") : "",
        };
      }).filter((row) => row.numero_pedido);

      setParsedData(parsed);
      setStep(3);
    } catch (error) {
      toast.error("Erro ao processar o arquivo");
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      for (const row of parsedData) {
        // Check if order already exists
        const { data: existing } = await supabase
          .from("pedidos")
          .select("id, codigos_rastreio, status, transportadora, prazo_entrega, status_entrega")
          .eq("user_id", user?.id)
          .eq("numero_pedido", row.numero_pedido)
          .single();

        if (existing) {
          if (conflictMode === "overwrite") {
            await supabase
              .from("pedidos")
              .update({
                codigos_rastreio: row.codigos_rastreio,
                status: row.status,
                transportadora: row.transportadora || null,
                prazo_entrega: row.prazo_entrega,
                status_entrega: row.status_entrega || null,
              })
              .eq("id", existing.id);
          } else {
            // Update only empty fields
            const updates: Record<string, any> = {};
            if (!existing.codigos_rastreio?.length && row.codigos_rastreio.length) {
              updates.codigos_rastreio = row.codigos_rastreio;
            }
            if (existing.status === "Aguardando Envio" && row.status !== "Aguardando Envio") {
              updates.status = row.status;
            }
            if (!existing.transportadora && row.transportadora) {
              updates.transportadora = row.transportadora;
            }
            if (existing.prazo_entrega === null && row.prazo_entrega !== null) {
              updates.prazo_entrega = row.prazo_entrega;
            }
            if (!existing.status_entrega && row.status_entrega) {
              updates.status_entrega = row.status_entrega;
            }
            if (Object.keys(updates).length > 0) {
              await supabase.from("pedidos").update(updates).eq("id", existing.id);
            }
          }
        } else {
          await supabase.from("pedidos").insert({
            user_id: user?.id,
            numero_pedido: row.numero_pedido,
            codigos_rastreio: row.codigos_rastreio,
            status: row.status,
            transportadora: row.transportadora || null,
            prazo_entrega: row.prazo_entrega,
            status_entrega: row.status_entrega || null,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success(`${parsedData.length} pedidos importados com sucesso`);
      resetAndClose();
    },
    onError: () => {
      toast.error("Erro ao importar pedidos");
    },
  });

  const resetAndClose = () => {
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setColumnMapping({ numero_pedido: "", codigos_rastreio: "", status: "", transportadora: "", prazo_entrega: "", status_entrega: "" });
    setStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Pedidos por Planilha</DialogTitle>
          <DialogDescription>
            {step === 1 && "Selecione um arquivo CSV ou XLSX para importar"}
            {step === 2 && "Mapeie as colunas do arquivo com os campos do sistema"}
            {step === 3 && "Revise os dados e confirme a importação"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: File Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Clique para selecionar ou arraste um arquivo
              </p>
              <p className="text-xs text-muted-foreground">CSV ou XLSX</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-secondary/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Arquivo: <span className="text-foreground">{file?.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número do Pedido *</Label>
                <Select
                  value={columnMapping.numero_pedido}
                  onValueChange={(v) => setColumnMapping({ ...columnMapping, numero_pedido: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Códigos de Rastreio</Label>
                <Select
                  value={columnMapping.codigos_rastreio}
                  onValueChange={(v) => setColumnMapping({ ...columnMapping, codigos_rastreio: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Múltiplos códigos separados por vírgula, ponto-vírgula ou barra
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={columnMapping.status}
                  onValueChange={(v) => setColumnMapping({ ...columnMapping, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Transportadora</Label>
                <Select
                  value={columnMapping.transportadora}
                  onValueChange={(v) => setColumnMapping({ ...columnMapping, transportadora: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prazo de Entrega (dias)</Label>
                <Select
                  value={columnMapping.prazo_entrega}
                  onValueChange={(v) => setColumnMapping({ ...columnMapping, prazo_entrega: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status de Entrega (Qualidade)</Label>
                <Select
                  value={columnMapping.status_entrega}
                  onValueChange={(v) => setColumnMapping({ ...columnMapping, status_entrega: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Valores aceitos: Excelente, Prazo, Ruim, Péssimo
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={handleMappingComplete}>Continuar</Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Import */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm">
                <span className="text-primary font-medium">{parsedData.length}</span> pedidos serão importados
              </p>
            </div>

            <div className="space-y-2">
              <Label>Se o pedido já existir:</Label>
              <RadioGroup value={conflictMode} onValueChange={(v) => setConflictMode(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <Label htmlFor="overwrite" className="font-normal">Sobrescrever todos os dados</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update_empty" id="update_empty" />
                  <Label htmlFor="update_empty" className="font-normal">Atualizar apenas campos vazios</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-2 text-left">Nº Pedido</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Códigos</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2">{row.numero_pedido}</td>
                      <td className="p-2">{row.status}</td>
                      <td className="p-2">{row.codigos_rastreio.length}</td>
                    </tr>
                  ))}
                  {parsedData.length > 5 && (
                    <tr className="border-t border-border">
                      <td colSpan={3} className="p-2 text-muted-foreground text-center">
                        ... e mais {parsedData.length - 5} pedidos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
                {importMutation.isPending ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Pedidos
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
