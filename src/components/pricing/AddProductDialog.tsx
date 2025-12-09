import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Package, DollarSign, TrendingUp, Percent, Link } from "lucide-react";
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

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculos: {
    precoCusto: number;
    frete: number;
    totalTaxas: number;
    precoVenda: number;
    lucro: number;
    markup: number;
    margemLiquida: number;
  };
}

export default function AddProductDialog({ open, onOpenChange, calculos }: AddProductDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [colecao, setColecao] = useState("");
  const [status, setStatus] = useState("ativo");
  const [ranking, setRanking] = useState("normal");
  const [linkProduto, setLinkProduto] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setNome("");
    setCategoria("");
    setColecao("");
    setStatus("ativo");
    setRanking("normal");
    setLinkProduto("");
    setImageFile(null);
    setImagePreview(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      setUploading(true);
      let fotoUrl: string | null = null;

      // Upload image if exists
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
      }

      // Insert product
      const { error } = await supabase.from('produtos').insert({
        user_id: user.id,
        nome,
        foto_url: fotoUrl,
        categoria,
        colecao,
        status,
        ranking,
        link_produto: linkProduto || null,
        preco_custo: calculos.precoCusto,
        frete: calculos.frete,
        total_taxas: calculos.totalTaxas,
        preco_venda: calculos.precoVenda,
        lucro: calculos.lucro,
        markup: calculos.markup,
        margem_liquida: calculos.margemLiquida
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto adicionado com sucesso!');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('Erro ao adicionar produto');
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('Digite o nome do produto');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Adicionar Novo Produto
          </DialogTitle>
        </DialogHeader>

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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Imagem
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectContent>
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

          {/* Informações da Calculadora */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Dados da Precificação
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Preço de Custo</span>
                </div>
                <p className="font-semibold">{formatCurrency(calculos.precoCusto + calculos.frete)}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Percent className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Taxas</span>
                </div>
                <p className="font-semibold">{formatCurrency(calculos.totalTaxas)}</p>
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

              <div className="bg-purple-500/10 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Percent className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-purple-500">Margem Líquida</span>
                </div>
                <p className="font-semibold text-purple-500">{calculos.margemLiquida.toFixed(1)}%</p>
              </div>

              <div className="bg-emerald-500/10 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">Preço de Venda</span>
                </div>
                <p className="font-semibold text-emerald-500">{formatCurrency(calculos.precoVenda)}</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={uploading || createMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {uploading || createMutation.isPending ? (
                "Salvando..."
              ) : (
                "Adicionar Produto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
