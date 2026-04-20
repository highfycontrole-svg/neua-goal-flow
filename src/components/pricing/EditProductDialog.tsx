import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, DollarSign, TrendingUp, Percent, Edit, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductVariants } from "./ProductVariants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";

const TAXA_GATEWAY = 5.69;
const TAXA_CHECKOUT = 1.69;
const IMPOSTOS = 6;
const TOTAL_TAXAS_PERCENT = TAXA_GATEWAY + TAXA_CHECKOUT + IMPOSTOS;

interface Produto {
  id: string;
  nome: string;
  foto_url: string | null;
  categoria: string | null;
  colecao: string | null;
  status: string;
  ranking: string;
  link_produto: string | null;
  preco_custo: number;
  frete: number;
  total_taxas: number;
  preco_venda: number;
  lucro: number;
  markup: number;
  margem_liquida: number;
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: Produto | null;
}

export default function EditProductDialog({ open, onOpenChange, produto }: EditProductDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [colecao, setColecao] = useState("");
  const [status, setStatus] = useState("ativo");
  const [ranking, setRanking] = useState("normal");
  const [linkProduto, setLinkProduto] = useState("");
  const [precoCusto, setPrecoCusto] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);
  const [precoVendaManual, setPrecoVendaManual] = useState<number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const calculos = useMemo(() => {
    const custoTotal = precoCusto + frete;
    const precoVenda = precoVendaManual;
    const totalTaxasValor = precoVenda * (TOTAL_TAXAS_PERCENT / 100);
    const lucro = precoVenda - custoTotal - totalTaxasValor;
    const markup = custoTotal > 0 ? precoVenda / custoTotal : 0;
    const margemLiquida = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0;

    return { custoTotal, totalTaxasValor, precoVenda, lucro, markup, margemLiquida };
  }, [precoCusto, frete, precoVendaManual]);

  useEffect(() => {
    if (produto) {
      setNome(produto.nome);
      setCategoria(produto.categoria || "");
      setColecao(produto.colecao || "");
      setStatus(produto.status);
      setRanking(produto.ranking);
      setLinkProduto(produto.link_produto || "");
      setPrecoCusto(produto.preco_custo);
      setFrete(produto.frete);
      setPrecoVendaManual(produto.preco_venda);
      setImagePreview(produto.foto_url);
      setImageFile(null);
    }
  }, [produto]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !produto) throw new Error("Dados inválidos");
      
      setUploading(true);
      let fotoUrl: string | null = produto.foto_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('produtos')
          .getPublicUrl(fileName);
        
        fotoUrl = urlData.publicUrl;
      } else if (!imagePreview) {
        fotoUrl = null;
      }

      const { error } = await supabase.from('produtos').update({
        nome,
        foto_url: fotoUrl,
        categoria,
        colecao,
        status,
        ranking,
        link_produto: linkProduto || null,
        preco_custo: precoCusto,
        frete: frete,
        total_taxas: calculos.totalTaxasValor,
        preco_venda: calculos.precoVenda,
        lucro: calculos.lucro,
        markup: calculos.markup,
        margem_liquida: calculos.margemLiquida
      }).eq('id', produto.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado com sucesso!');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('Erro ao atualizar produto');
    },
    onSettled: () => setUploading(false),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('Digite o nome do produto');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar Produto
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Gerais */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Informações Gerais
              </h3>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Camiseta Básica Neua"
                  required
                />
              </div>

              {/* Upload de Foto */}
              <div className="space-y-2">
                <Label>Foto do Produto</Label>
                <div className="flex items-center gap-4">
                  <AnimatePresence mode="wait">
                    {imagePreview ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative w-24 h-24"
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {!imagePreview && (
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Selecionar Imagem
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex: Camisetas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colecao">Coleção</Label>
                  <Input
                    id="colecao"
                    value={colecao}
                    onChange={(e) => setColecao(e.target.value)}
                    placeholder="Ex: Verão 2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ranking</Label>
                  <Select value={ranking} onValueChange={setRanking}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="campeao">⭐ Campeão</SelectItem>
                      <SelectItem value="bom">👍 Bom Produto</SelectItem>
                      <SelectItem value="normal">📦 Normal</SelectItem>
                      <SelectItem value="ruim">👎 Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkProduto" className="flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  Link do Produto
                </Label>
                <Input
                  id="linkProduto"
                  type="url"
                  value={linkProduto}
                  onChange={(e) => setLinkProduto(e.target.value)}
                  placeholder="https://exemplo.com/produto"
                />
              </div>
            </div>

            {/* Precificação Editável */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Precificação
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precoCusto">Custo do Produto (R$)</Label>
                  <Input
                    id="precoCusto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precoCusto || ''}
                    onChange={(e) => setPrecoCusto(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frete">Frete (R$)</Label>
                  <Input
                    id="frete"
                    type="number"
                    min="0"
                    step="0.01"
                    value={frete || ''}
                    onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoVenda">Preço de Venda (R$)</Label>
                  <Input
                    id="precoVenda"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precoVendaManual || ''}
                    onChange={(e) => setPrecoVendaManual(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="border-primary/50"
                  />
                </div>
              </div>

              {/* Resultados Calculados */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Custo Total</span>
                  </div>
                  <p className="font-semibold">{formatCurrency(calculos.custoTotal)}</p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total Taxas</span>
                  </div>
                  <p className="font-semibold">{formatCurrency(calculos.totalTaxasValor)}</p>
                </div>

                <div className="bg-green-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">Lucro</span>
                  </div>
                  <p className="font-semibold text-green-500">{formatCurrency(calculos.lucro)}</p>
                </div>

                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary">Markup</span>
                  </div>
                  <p className="font-semibold text-primary">{calculos.markup.toFixed(2)}x</p>
                </div>

                <div className="bg-purple-500/10 rounded-lg p-3 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1 mb-1">
                    <Percent className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-purple-500">Margem Líquida</span>
                  </div>
                  <p className="font-semibold text-purple-500">{calculos.margemLiquida.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Variantes */}
            {produto && <ProductVariants productId={produto.id} />}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploading || updateMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {uploading || updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
