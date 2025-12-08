import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Calculator, Package, Plus, DollarSign, TrendingUp, Percent, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AddProductDialog from "@/components/pricing/AddProductDialog";
import ProductCard from "@/components/pricing/ProductCard";

const TAXA_GATEWAY = 5.69;
const TAXA_CHECKOUT = 1.69;
const IMPOSTOS = 6;
const CUSTO_PERCENTUAL = 40;

export default function PricingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [custoProduto, setCustoProduto] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Cálculos automáticos
  const calculos = useMemo(() => {
    const custoTotal = custoProduto + frete;
    const totalTaxasPercent = TAXA_GATEWAY + TAXA_CHECKOUT + IMPOSTOS;
    
    // Se custos = 40% do preço final, então preço final = custos / 0.40
    const precoVenda = custoTotal > 0 ? custoTotal / (CUSTO_PERCENTUAL / 100) : 0;
    
    // Total de taxas em valor
    const totalTaxasValor = precoVenda * (totalTaxasPercent / 100);
    
    // Lucro = Preço de venda - custo total - taxas
    const lucro = precoVenda - custoTotal - totalTaxasValor;
    
    // Markup = (preço final / custo) 
    const markup = custoTotal > 0 ? precoVenda / custoTotal : 0;
    
    // Margem líquida = (lucro / preço de venda) * 100
    const margemLiquida = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0;
    
    // Simulação 20 unidades
    const faturamento20 = precoVenda * 20;
    const lucro20 = lucro * 20;

    return {
      custoTotal,
      totalTaxasPercent,
      totalTaxasValor,
      precoVenda,
      lucro,
      markup,
      margemLiquida,
      faturamento20,
      lucro20
    };
  }, [custoProduto, frete]);

  // Query produtos
  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir produto');
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          Precificação & Produtos Neua
        </h1>
        <p className="text-muted-foreground">
          Calcule preços de venda e gerencie seu catálogo de produtos
        </p>
      </motion.div>

      {/* DOBRA 1 - Calculadora de Precificação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#1E1E1E] border-border/50">
          <CardHeader>
            <CardTitle className="text-xl text-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Calculadora de Precificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="custo" className="text-foreground">
                  Custo do Fornecedor (R$)
                </Label>
                <Input
                  id="custo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={custoProduto || ''}
                  onChange={(e) => setCustoProduto(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="bg-background/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frete" className="text-foreground">
                  Frete (R$)
                </Label>
                <Input
                  id="frete"
                  type="number"
                  min="0"
                  step="0.01"
                  value={frete || ''}
                  onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="bg-background/50 border-border"
                />
              </div>
            </div>

            {/* Taxas Fixas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Taxa Gateway</p>
                <p className="text-lg font-bold text-foreground">{TAXA_GATEWAY}%</p>
              </div>
              <div className="bg-background/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Taxa Checkout</p>
                <p className="text-lg font-bold text-foreground">{TAXA_CHECKOUT}%</p>
              </div>
              <div className="bg-background/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Impostos</p>
                <p className="text-lg font-bold text-foreground">{IMPOSTOS}%</p>
              </div>
            </div>

            {/* Resultados */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <motion.div 
                className="bg-primary/10 border border-primary/30 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Markup</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {calculos.markup.toFixed(2)}x
                </p>
              </motion.div>

              <motion.div 
                className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Preço de Venda</span>
                </div>
                <p className="text-xl font-bold text-green-500">
                  {formatCurrency(calculos.precoVenda)}
                </p>
              </motion.div>

              <motion.div 
                className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Faturamento (20un)</span>
                </div>
                <p className="text-xl font-bold text-blue-500">
                  {formatCurrency(calculos.faturamento20)}
                </p>
              </motion.div>

              <motion.div 
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Lucro (20un)</span>
                </div>
                <p className="text-xl font-bold text-emerald-500">
                  {formatCurrency(calculos.lucro20)}
                </p>
              </motion.div>

              <motion.div 
                className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Margem Líquida</span>
                </div>
                <p className="text-xl font-bold text-purple-500">
                  {calculos.margemLiquida.toFixed(1)}%
                </p>
              </motion.div>
            </div>

            {/* Botão Adicionar Produto */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                disabled={calculos.custoTotal <= 0}
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* DOBRA 2 - Listagem de Produtos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Catálogo de Produtos Neua
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : produtos && produtos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtos.map((produto) => (
                  <ProductCard
                    key={produto.id}
                    produto={produto}
                    onDelete={() => deleteMutation.mutate(produto.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum produto cadastrado ainda.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use a calculadora acima para adicionar seu primeiro produto.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Adicionar Produto */}
      <AddProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        calculos={{
          precoCusto: custoProduto,
          frete,
          totalTaxas: calculos.totalTaxasValor,
          precoVenda: calculos.precoVenda,
          lucro: calculos.lucro,
          markup: calculos.markup,
          margemLiquida: calculos.margemLiquida
        }}
      />
    </div>
  );
}
