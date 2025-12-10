import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, X, Trash2, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Variant {
  id: string;
  product_id: string;
  nome: string;
  foto_url: string | null;
  preco_custo: number;
  preco_venda: number;
}

interface ProductVariantsProps {
  productId: string;
}

export function ProductVariants({ productId }: ProductVariantsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({
    nome: '',
    preco_custo: 0,
    preco_venda: 0,
    foto_url: null as string | null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Variant[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let fotoUrl: string | null = null;

      if (imageFile && user?.id) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `variants/${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('produtos')
          .getPublicUrl(fileName);
        
        fotoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('product_variants').insert({
        product_id: productId,
        nome: newVariant.nome,
        preco_custo: newVariant.preco_custo,
        preco_venda: newVariant.preco_venda,
        foto_url: fotoUrl,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variante adicionada!');
      resetForm();
    },
    onError: () => toast.error('Erro ao adicionar variante'),
    onSettled: () => setUploading(false),
  });

  const updateMutation = useMutation({
    mutationFn: async (variant: Variant) => {
      const { error } = await supabase
        .from('product_variants')
        .update({
          nome: variant.nome,
          preco_custo: variant.preco_custo,
          preco_venda: variant.preco_venda,
        })
        .eq('id', variant.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variante atualizada!');
      setEditingId(null);
    },
    onError: () => toast.error('Erro ao atualizar variante'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variante excluída!');
    },
    onError: () => toast.error('Erro ao excluir variante'),
  });

  const resetForm = () => {
    setIsAdding(false);
    setNewVariant({ nome: '', preco_custo: 0, preco_venda: 0, foto_url: null });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVariant(prev => ({ ...prev, foto_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.nome.trim()) {
      toast.error('Digite o nome da variante');
      return;
    }
    addMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <Separator className="my-6" />
      
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Variantes do Produto
        </h3>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar Variante
          </Button>
        )}
      </div>

      {/* Add Variant Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddVariant}
            className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Variante *</Label>
                <Input
                  value={newVariant.nome}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Tamanho P, Cor Azul"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Foto</Label>
                <div className="flex items-center gap-2">
                  {newVariant.foto_url ? (
                    <div className="relative w-12 h-12">
                      <img
                        src={newVariant.foto_url}
                        alt="Preview"
                        className="w-full h-full object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewVariant(prev => ({ ...prev, foto_url: null }));
                          setImageFile(null);
                        }}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Foto
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço de Custo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newVariant.preco_custo || ''}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, preco_custo: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço de Venda (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newVariant.preco_venda || ''}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, preco_venda: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading || addMutation.isPending}>
                {uploading || addMutation.isPending ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Variants List */}
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">Carregando variantes...</div>
      ) : variants.length > 0 ? (
        <div className="grid gap-3">
          {variants.map((variant) => (
            <VariantItem
              key={variant.id}
              variant={variant}
              isEditing={editingId === variant.id}
              onEdit={() => setEditingId(variant.id)}
              onSave={(updated) => updateMutation.mutate(updated)}
              onCancel={() => setEditingId(null)}
              onDelete={() => deleteMutation.mutate(variant.id)}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      ) : !isAdding ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nenhuma variante cadastrada
        </div>
      ) : null}
    </div>
  );
}

interface VariantItemProps {
  variant: Variant;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (variant: Variant) => void;
  onCancel: () => void;
  onDelete: () => void;
  formatCurrency: (value: number) => string;
}

function VariantItem({
  variant,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  formatCurrency,
}: VariantItemProps) {
  const [editData, setEditData] = useState(variant);

  if (isEditing) {
    return (
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input
              value={editData.nome}
              onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Custo (R$)</Label>
            <Input
              type="number"
              value={editData.preco_custo || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, preco_custo: parseFloat(e.target.value) || 0 }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Venda (R$)</Label>
            <Input
              type="number"
              value={editData.preco_venda || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, preco_venda: parseFloat(e.target.value) || 0 }))}
              className="h-9"
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" onClick={() => onSave(editData)} className="h-9">
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel} className="h-9">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        {variant.foto_url && (
          <img
            src={variant.foto_url}
            alt={variant.nome}
            className="w-10 h-10 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{variant.nome}</p>
          <p className="text-sm text-muted-foreground">
            Custo: {formatCurrency(variant.preco_custo)} | Venda: {formatCurrency(variant.preco_venda)}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-8 w-8">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
