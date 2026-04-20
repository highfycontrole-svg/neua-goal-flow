import { motion } from "framer-motion";
import { Package, Trash2, DollarSign, TrendingUp, Percent, Star, ThumbsUp, ThumbsDown, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";

interface Produto {
  id: string;
  nome: string;
  foto_url: string | null;
  categoria: string | null;
  colecao: string | null;
  status: string;
  ranking: string;
  preco_custo: number;
  frete: number;
  total_taxas: number;
  preco_venda: number;
  lucro: number;
  markup: number;
  margem_liquida: number;
}

interface ProductCardProps {
  produto: Produto;
  onDelete: () => void;
  onEdit: () => void;
}

export default function ProductCard({ produto, onDelete, onEdit }: ProductCardProps) {
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

  const getStatusColor = (status: string) => {
    return status === 'ativo' 
      ? 'bg-green-500/10 text-green-500 border-green-500/30'
      : 'bg-red-500/10 text-red-500 border-red-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="border-border/30 overflow-hidden group cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
        onClick={onEdit}
        style={{ backgroundColor: 'hsl(var(--surface-3))' }}
      >
        {/* Image */}
        <div className="relative h-40 bg-muted/30">
          {produto.foto_url ? (
            <img
              src={produto.foto_url}
              alt={produto.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Status Badge */}
          <Badge 
            variant="outline" 
            className={`absolute top-2 left-2 ${getStatusColor(produto.status)}`}
          >
            {produto.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-primary/80 hover:text-primary-foreground h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O produto "{produto.nome}" será removido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Nome e Ranking */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-2">
              {produto.nome}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {getRankingIcon(produto.ranking)}
            </div>
          </div>

          {/* Categoria e Coleção */}
          <div className="flex flex-wrap gap-2">
            {produto.categoria && (
              <Badge variant="secondary" className="text-xs">
                {produto.categoria}
              </Badge>
            )}
            {produto.colecao && (
              <Badge variant="outline" className="text-xs">
                {produto.colecao}
              </Badge>
            )}
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Custo</span>
              </div>
              <p className="text-sm font-medium">
                {formatCurrency(produto.preco_custo + produto.frete)}
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">Venda</span>
              </div>
              <p className="text-sm font-medium text-green-500">
                {formatCurrency(produto.preco_venda)}
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary">Markup</span>
              </div>
              <p className="text-sm font-medium text-primary">
                {produto.markup.toFixed(2)}x
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-purple-500">Margem</span>
              </div>
              <p className="text-sm font-medium text-purple-500">
                {produto.margem_liquida.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Lucro */}
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
            <span className="text-xs text-emerald-500">Lucro por unidade</span>
            <p className="text-lg font-bold text-emerald-500">
              {formatCurrency(produto.lucro)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
