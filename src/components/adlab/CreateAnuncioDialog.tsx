import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { PlayCircle, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreateAnuncioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packId: string;
  produtoNome: string;
  packNome: string;
}

interface Cena {
  numero: number;
  descricao: string;
}

export function CreateAnuncioDialog({ 
  open, 
  onOpenChange, 
  packId, 
  produtoNome, 
  packNome 
}: CreateAnuncioDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [insightEspecifico, setInsightEspecifico] = useState('');
  const [ganchoPrincipal, setGanchoPrincipal] = useState('');
  const [formato, setFormato] = useState('video_ugc');
  const [cenas, setCenas] = useState<Cena[]>([
    { numero: 1, descricao: '' },
    { numero: 2, descricao: '' },
    { numero: 3, descricao: '' },
  ]);
  const [ctaFinal, setCtaFinal] = useState('');
  const [copyAnuncio, setCopyAnuncio] = useState('');
  const [linkReferencia, setLinkReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [statusProducao, setStatusProducao] = useState('ideia');
  const [linkAnuncioPronto, setLinkAnuncioPronto] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const roteiroVisual = {
        cenas: cenas.filter(c => c.descricao.trim()).map(c => ({ numero: c.numero, descricao: c.descricao })),
        cta_final: ctaFinal,
      };

      const { error } = await supabase.from('ad_anuncios').insert({
        user_id: user?.id!,
        pack_id: packId,
        titulo,
        insight_especifico: insightEspecifico || null,
        gancho_principal: ganchoPrincipal || null,
        formato,
        roteiro_visual: roteiroVisual as any,
        copy_anuncio: copyAnuncio || null,
        link_referencia: linkReferencia || null,
        link_anuncio_pronto: linkAnuncioPronto || null,
        observacoes: observacoes || null,
        status_producao: statusProducao,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anuncios', packId] });
      queryClient.invalidateQueries({ queryKey: ['anuncio-counts'] });
      toast.success('Anúncio criado com sucesso!');
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao criar anúncio');
    },
  });

  const resetForm = () => {
    setTitulo('');
    setInsightEspecifico('');
    setGanchoPrincipal('');
    setFormato('video_ugc');
    setCenas([
      { numero: 1, descricao: '' },
      { numero: 2, descricao: '' },
      { numero: 3, descricao: '' },
    ]);
    setCtaFinal('');
    setCopyAnuncio('');
    setLinkReferencia('');
    setLinkAnuncioPronto('');
    setObservacoes('');
    setStatusProducao('ideia');
  };

  const addCena = () => {
    setCenas([...cenas, { numero: cenas.length + 1, descricao: '' }]);
  };

  const removeCena = (index: number) => {
    if (cenas.length > 1) {
      const newCenas = cenas.filter((_, i) => i !== index).map((c, i) => ({ ...c, numero: i + 1 }));
      setCenas(newCenas);
    }
  };

  const updateCena = (index: number, descricao: string) => {
    const newCenas = [...cenas];
    newCenas[index].descricao = descricao;
    setCenas(newCenas);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('Título do anúncio é obrigatório');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Adicionar Anúncio
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Produto & Pack Info */}
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Produto:</span>
                  <span className="ml-2 font-medium text-foreground">{produtoNome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pack:</span>
                  <span className="ml-2 font-medium text-foreground">{packNome}</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="ideia" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ideia">Ideia</TabsTrigger>
                <TabsTrigger value="roteiro">Roteiro</TabsTrigger>
                <TabsTrigger value="copy">Copy</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
              </TabsList>

              <TabsContent value="ideia" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Ideia *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Rotina matinal minimalista..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insight">Insight Específico</Label>
                  <Textarea
                    id="insight"
                    placeholder="Qual o insight específico deste anúncio?"
                    value={insightEspecifico}
                    onChange={(e) => setInsightEspecifico(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gancho">Gancho Principal</Label>
                  <Textarea
                    id="gancho"
                    placeholder="Qual o gancho que vai capturar a atenção?"
                    value={ganchoPrincipal}
                    onChange={(e) => setGanchoPrincipal(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formato">Formato do Anúncio</Label>
                  <Select value={formato} onValueChange={setFormato}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video_ugc">🎬 Vídeo UGC</SelectItem>
                      <SelectItem value="reels">📱 Reels</SelectItem>
                      <SelectItem value="story">📲 Story</SelectItem>
                      <SelectItem value="imagem_estatica">🖼️ Imagem Estática</SelectItem>
                      <SelectItem value="carrossel">📑 Carrossel</SelectItem>
                      <SelectItem value="outro">📝 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="roteiro" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Roteiro Visual</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCena}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Cena
                    </Button>
                  </div>
                  
                  {cenas.map((cena, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-20">
                        <span className="text-sm text-muted-foreground">Cena {cena.numero}</span>
                      </div>
                      <Textarea
                        placeholder={`Descrição da cena ${cena.numero}...`}
                        value={cena.descricao}
                        onChange={(e) => updateCena(index, e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      {cenas.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeCena(index)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta">CTA Final</Label>
                  <Textarea
                    id="cta"
                    placeholder="Call-to-action final do anúncio..."
                    value={ctaFinal}
                    onChange={(e) => setCtaFinal(e.target.value)}
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="copy" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="copy">Copy do Anúncio</Label>
                  <Textarea
                    id="copy"
                    placeholder="Escreva a copy completa do anúncio aqui...

Use quebras de linha, emojis, formatação...

📌 Dica: Escreva como se fosse a legenda final do post."
                    value={copyAnuncio}
                    onChange={(e) => setCopyAnuncio(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Suporta formatação livre. Use emojis, quebras de linha e organize como desejar.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="linkPronto">Link do Anúncio Pronto</Label>
                  <Input
                    id="linkPronto"
                    placeholder="https://meta.ads/... ou https://drive.google.com/..."
                    value={linkAnuncioPronto}
                    onChange={(e) => setLinkAnuncioPronto(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o link do anúncio publicado (Meta Ads, TikTok, Drive, etc)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referencia">Link de Referência</Label>
                  <Input
                    id="referencia"
                    placeholder="https://exemplo.com/inspiracao"
                    value={linkReferencia}
                    onChange={(e) => setLinkReferencia(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Notas e observações sobre o anúncio..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusProducao">Status de Produção</Label>
                  <Select value={statusProducao} onValueChange={setStatusProducao}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ideia">💡 Ideia</SelectItem>
                      <SelectItem value="para_fazer">📋 Para Fazer</SelectItem>
                      <SelectItem value="em_producao">🎬 Em Produção</SelectItem>
                      <SelectItem value="pronto">✅ Pronto</SelectItem>
                      <SelectItem value="rodando">🚀 Rodando</SelectItem>
                      <SelectItem value="pausado">⏸️ Pausado</SelectItem>
                      <SelectItem value="finalizado">🏁 Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Anúncio'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
