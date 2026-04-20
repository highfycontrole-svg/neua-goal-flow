import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Calculator, Package, Plus, DollarSign, TrendingUp, Percent, BarChart3,
  LayoutGrid, List, Filter, Star, ThumbsUp, ThumbsDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AddProductDialog from "@/components/pricing/AddProductDialog";
import EditProductDialog from "@/components/pricing/EditProductDialog";
import ProductCard from "@/components/pricing/ProductCard";
import { formatCurrency } from "@/lib/utils";

const TAXA_GATEWAY = 5.69;
const TAXA_CHECKOUT = 1.69;
const IMPOSTOS = 6;

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

export default function PricingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [custoProduto, setCustoProduto] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  
  // Filtros
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [rankingFilter, setRankingFilter] = useState<string>('todos');

  // Cálculos automáticos - margem líquida final = 60%
  // Fórmula: custos + taxas = 40% do preço final, então lucro = 60%
  const calculos = useMemo(() => {
    const custoTotal = custoProduto + frete;
    const totalTaxasPercent = TAXA_GATEWAY + TAXA_CHECKOUT + IMPOSTOS; // 13.38%
    
    // Para margem líquida de 60%, precisamos que:
    // lucro = 60% do preço de venda
    // preço_venda = custo_total + taxas + lucro
    // preço_venda = custo_total + (preço_venda * 13.38%) + (preço_venda * 60%)
    // preço_venda = custo_total + preço_venda * 73.38%
    // preço_venda - preço_venda * 0.7338 = custo_total
    // preço_venda * 0.2662 = custo_total
    // preço_venda = custo_total / 0.2662
    const percentualCusto = (100 - 60 - totalTaxasPercent) / 100; // 26.62%
    const precoVenda = custoTotal > 0 ? custoTotal / percentualCusto : 0;
    
    // Total de taxas em valor
    const totalTaxasValor = precoVenda * (totalTaxasPercent / 100);
    
    // Lucro = 60% do preço de venda
    const lucro = precoVenda * 0.60;
    
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
      return data as Produto[];
    },
    enabled: !!user?.id
  });

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    if (!produtos) return [];
    
    return produtos.filter(produto => {
      const matchStatus = statusFilter === 'todos' || produto.status === statusFilter;
      const matchRanking = rankingFilter === 'todos' || produto.ranking === rankingFilter;
      return matchStatus && matchRanking;
    });
  }, [produtos, statusFilter, rankingFilter]);

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

  const handleEditProduct = (produto: Produto) => {
    setSelectedProduct(produto);
    setEditDialogOpen(true);
  };

  const getRankingIcon = (ranking: string) => {
    switch (ranking) {
      case 'campeao':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'bom':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'ruim':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankingLabel = (ranking: string) => {
    switch (ranking) {
      case 'campeao':
        return 'Campeão';
      case 'bom':
        return 'Bom Produto';
      case 'ruim':
        return 'Ruim';
      default:
        return 'Normal';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'ativo' 
      ? <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Ativo</Badge>
      : <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Inativo</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <PageHeader
        icon={Calculator}
        title="Precificação & Produtos Neua"
        description="Calcule preços de venda e gerencie seu catálogo de produtos"
      />

      {/* DOBRA 1 - Calculadora de Precificação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/30 backdrop-blur-xl" style={{ backgroundColor: 'hsl(var(--surface-1) / 0.85)' }}>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Calculadora de Precificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="custo" className="text-foreground text-sm">
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
                <Label htmlFor="frete" className="text-foreground text-sm">
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-background/30 rounded-lg p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Taxa Gateway</p>
                <p className="text-sm sm:text-lg font-bold text-foreground">{TAXA_GATEWAY}%</p>
              </div>
              <div className="bg-background/30 rounded-lg p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Taxa Checkout</p>
                <p className="text-sm sm:text-lg font-bold text-foreground">{TAXA_CHECKOUT}%</p>
              </div>
              <div className="bg-background/30 rounded-lg p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Impostos</p>
                <p className="text-sm sm:text-lg font-bold text-foreground">{IMPOSTOS}%</p>
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
        <Card className="border-border/30" style={{ backgroundColor: 'hsl(var(--surface-1))' }}>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Catálogo de Produtos Neua
              </CardTitle>
              
              {/* Filtros e Visualização */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro Status */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Ranking */}
                <Select value={rankingFilter} onValueChange={setRankingFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Ranking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Rankings</SelectItem>
                    <SelectItem value="campeao">⭐ Campeão</SelectItem>
                    <SelectItem value="bom">👍 Bom Produto</SelectItem>
                    <SelectItem value="normal">📦 Normal</SelectItem>
                    <SelectItem value="ruim">👎 Ruim</SelectItem>
                  </SelectContent>
                </Select>

                {/* Toggle Visualização */}
                <div className="flex items-center bg-muted/50 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((produto) => (
                    <ProductCard
                      key={produto.id}
                      produto={produto}
                      onDelete={() => deleteMutation.mutate(produto.id)}
                      onEdit={() => handleEditProduct(produto)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ranking</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                        <TableHead className="text-right">Venda</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead className="text-right">Markup</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((produto) => (
                        <TableRow 
                          key={produto.id} 
                          className="cursor-pointer transition-all duration-200 hover:bg-white/5"
                          onClick={() => handleEditProduct(produto)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {produto.foto_url ? (
                                <img
                                  src={produto.foto_url}
                                  alt={produto.nome}
                                  className="w-10 h-10 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <span className="font-medium">{produto.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {produto.categoria ? (
                              <Badge variant="secondary">{produto.categoria}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(produto.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRankingIcon(produto.ranking)}
                              <span className="text-sm">{getRankingLabel(produto.ranking)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(produto.preco_custo + produto.frete)}
                          </TableCell>
                          <TableCell className="text-right text-green-500 font-medium">
                            {formatCurrency(produto.preco_venda)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-500 font-medium">
                            {formatCurrency(produto.lucro)}
                          </TableCell>
                          <TableCell className="text-right text-primary font-medium">
                            {produto.markup.toFixed(2)}x
                          </TableCell>
                          <TableCell className="text-right text-purple-500 font-medium">
                            {produto.margem_liquida.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {produtos && produtos.length > 0 
                    ? 'Nenhum produto encontrado com os filtros selecionados.'
                    : 'Nenhum produto cadastrado ainda.'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {produtos && produtos.length > 0 
                    ? 'Tente ajustar os filtros para ver mais produtos.'
                    : 'Use a calculadora acima para adicionar seu primeiro produto.'
                  }
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

      {/* Dialog Editar Produto */}
      <EditProductDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        produto={selectedProduct}
      />
    </div>
  );
}
