import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Anuncio {
  id: string;
  titulo: string;
  insight_especifico: string | null;
  gancho_principal: string | null;
  formato: string;
  roteiro_visual: any;
  copy_anuncio: string | null;
  link_referencia: string | null;
  observacoes: string | null;
  status_producao: string;
  status_performance: string | null;
  aprendizado_funcionou: string | null;
  aprendizado_nao_funcionou: string | null;
  aprendizado_recomendacoes: string | null;
}

interface EditAnuncioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anuncio: Anuncio;
  produtoNome: string;
  packNome: string;
}

interface Cena {
  numero: number;
  descricao: string;
}

export function EditAnuncioDialog({ 
  open, 
  onOpenChange, 
  anuncio,
  produtoNome, 
  packNome 
}: EditAnuncioDialogProps) {
  const queryClient = useQueryClient();
  
  // Parse roteiro_visual
  const parseRoteiro = () => {
    if (anuncio.roteiro_visual && typeof anuncio.roteiro_visual === 'object') {
      const cenas = anuncio.roteiro_visual.cenas || [];
      return {
        cenas: cenas.length > 0 ? cenas : [{ numero: 1, descricao: '' }],
        ctaFinal: anuncio.roteiro_visual.cta_final || '',
      };
    }
    return { cenas: [{ numero: 1, descricao: '' }], ctaFinal: '' };
  };

  const initialRoteiro = parseRoteiro();

  // Form state
  const [titulo, setTitulo] = useState(anuncio.titulo);
  const [insightEspecifico, setInsightEspecifico] = useState(anuncio.insight_especifico || '');
  const [ganchoPrincipal, setGanchoPrincipal] = useState(anuncio.gancho_principal || '');
  const [formato, setFormato] = useState(anuncio.formato);
  const [cenas, setCenas] = useState<Cena[]>(initialRoteiro.cenas);
  const [ctaFinal, setCtaFinal] = useState(initialRoteiro.ctaFinal);
  const [copyAnuncio, setCopyAnuncio] = useState(anuncio.copy_anuncio || '');
  const [linkReferencia, setLinkReferencia] = useState(anuncio.link_referencia || '');
  const [observacoes, setObservacoes] = useState(anuncio.observacoes || '');
  const [statusProducao, setStatusProducao] = useState(anuncio.status_producao);
  const [statusPerformance, setStatusPerformance] = useState(anuncio.status_performance || 'nao_avaliado');
  const [aprendizadoFuncionou, setAprendizadoFuncionou] = useState(anuncio.aprendizado_funcionou || '');
  const [aprendizadoNaoFuncionou, setAprendizadoNaoFuncionou] = useState(anuncio.aprendizado_nao_funcionou || '');
  const [aprendizadoRecomendacoes, setAprendizadoRecomendacoes] = useState(anuncio.aprendizado_recomendacoes || '');

  useEffect(() => {
    const roteiro = parseRoteiro();
    setTitulo(anuncio.titulo);
    setInsightEspecifico(anuncio.insight_especifico || '');
    setGanchoPrincipal(anuncio.gancho_principal || '');
    setFormato(anuncio.formato);
    setCenas(roteiro.cenas);
    setCtaFinal(roteiro.ctaFinal);
    setCopyAnuncio(anuncio.copy_anuncio || '');
    setLinkReferencia(anuncio.link_referencia || '');
    setObservacoes(anuncio.observacoes || '');
    setStatusProducao(anuncio.status_producao);
    setStatusPerformance(anuncio.status_performance || 'nao_avaliado');
    setAprendizadoFuncionou(anuncio.aprendizado_funcionou || '');
    setAprendizadoNaoFuncionou(anuncio.aprendizado_nao_funcionou || '');
    setAprendizadoRecomendacoes(anuncio.aprendizado_recomendacoes || '');
  }, [anuncio]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const roteiroVisual = {
        cenas: cenas.filter(c => c.descricao.trim()).map(c => ({ numero: c.numero, descricao: c.descricao })),
        cta_final: ctaFinal,
      };

      const { error } = await supabase
        .from('ad_anuncios')
        .update({
          titulo,
          insight_especifico: insightEspecifico || null,
          gancho_principal: ganchoPrincipal || null,
          formato,
          roteiro_visual: roteiroVisual as any,
          copy_anuncio: copyAnuncio || null,
          link_referencia: linkReferencia || null,
          observacoes: observacoes || null,
          status_producao: statusProducao,
          status_performance: statusPerformance === 'nao_avaliado' ? null : statusPerformance,
          aprendizado_funcionou: aprendizadoFuncionou || null,
          aprendizado_nao_funcionou: aprendizadoNaoFuncionou || null,
          aprendizado_recomendacoes: aprendizadoRecomendacoes || null,
        })
        .eq('id', anuncio.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anuncios'] });
      toast.success('Anúncio atualizado com sucesso!');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar anúncio');
    },
  });

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
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Anúncio
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="ideia">Ideia</TabsTrigger>
                <TabsTrigger value="roteiro">Roteiro</TabsTrigger>
                <TabsTrigger value="copy">Copy</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
                <TabsTrigger value="aprendizado">Aprendizado</TabsTrigger>
              </TabsList>

              <TabsContent value="ideia" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Ideia *</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insight">Insight Específico</Label>
                  <Textarea
                    id="insight"
                    value={insightEspecifico}
                    onChange={(e) => setInsightEspecifico(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gancho">Gancho Principal</Label>
                  <Textarea
                    id="gancho"
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
                    value={copyAnuncio}
                    onChange={(e) => setCopyAnuncio(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="referencia">Link de Referência</Label>
                  <Input
                    id="referencia"
                    value={linkReferencia}
                    onChange={(e) => setLinkReferencia(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="statusPerformance">Status de Performance</Label>
                    <Select value={statusPerformance} onValueChange={setStatusPerformance}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_avaliado">Não avaliado</SelectItem>
                        <SelectItem value="otima">🏆 Ótima Performance</SelectItem>
                        <SelectItem value="boa">👍 Boa Performance</SelectItem>
                        <SelectItem value="media">😐 Média Performance</SelectItem>
                        <SelectItem value="ruim">👎 Ruim Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="aprendizado" className="space-y-4 mt-4">
                <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    📚 Registre os aprendizados deste anúncio para referência futura. 
                    Este campo é especialmente importante quando o status é "Finalizado".
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funcionou">O que funcionou?</Label>
                  <Textarea
                    id="funcionou"
                    placeholder="Elementos, abordagens ou estratégias que tiveram bom resultado..."
                    value={aprendizadoFuncionou}
                    onChange={(e) => setAprendizadoFuncionou(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="naoFuncionou">O que não funcionou?</Label>
                  <Textarea
                    id="naoFuncionou"
                    placeholder="O que deve ser evitado ou ajustado em próximos anúncios..."
                    value={aprendizadoNaoFuncionou}
                    onChange={(e) => setAprendizadoNaoFuncionou(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recomendacoes">Recomendações Futuras</Label>
                  <Textarea
                    id="recomendacoes"
                    placeholder="Sugestões e insights para próximas criações..."
                    value={aprendizadoRecomendacoes}
                    onChange={(e) => setAprendizadoRecomendacoes(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
