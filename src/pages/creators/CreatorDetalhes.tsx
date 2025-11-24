import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CreatorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creator, setCreator] = useState<any>(null);
  const [desempenho, setDesempenho] = useState<any[]>([]);
  const [logistica, setLogistica] = useState<any[]>([]);
  const [interacoes, setInteracoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (user && id) loadCreatorData();
  }, [user, id]);

  const loadCreatorData = async () => {
    try {
      setLoading(true);

      const { data: creatorData, error: creatorError } = await supabase
        .from('arquitetos')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (creatorError) throw creatorError;
      setCreator(creatorData);
      setEditData(creatorData);

      const { data: desempenhoData } = await supabase
        .from('desempenho_financeiro')
        .select('*')
        .eq('arquiteto_id', id)
        .eq('user_id', user?.id)
        .order('mes_referencia', { ascending: false });

      const { data: logisticaData } = await supabase
        .from('logistica_conteudo')
        .select('*')
        .eq('arquiteto_id', id)
        .eq('user_id', user?.id)
        .order('mes_referencia', { ascending: false });

      const { data: interacoesData } = await supabase
        .from('interacoes')
        .select('*')
        .eq('arquiteto_id', id)
        .eq('user_id', user?.id)
        .order('data_interacao', { ascending: false });

      setDesempenho(desempenhoData || []);
      setLogistica(logisticaData || []);
      setInteracoes(interacoesData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados do creator');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('arquitetos')
        .update(editData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Creator atualizado com sucesso');
      setCreator(editData);
      setEditing(false);
      loadCreatorData();
    } catch (error: any) {
      toast.error('Erro ao atualizar creator');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Creator não encontrado</p>
        <Button onClick={() => navigate('/creators/registro')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const colors = {
      'Bronze': 'bg-orange-900/20 text-orange-400 border-orange-400/30',
      'Prata': 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      'Ouro': 'bg-yellow-600/20 text-yellow-400 border-yellow-400/30',
      'Platina': 'bg-cyan-600/20 text-cyan-400 border-cyan-400/30'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/creators/registro')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-display font-bold">{creator.nome_completo}</h1>
            <p className="text-muted-foreground">{creator.arroba_principal}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => {
                setEditing(false);
                setEditData(creator);
              }}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="card-neua p-6">
        <h2 className="text-2xl font-display font-bold mb-6">Dados Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Nome Completo</Label>
            {editing ? (
              <Input
                value={editData.nome_completo}
                onChange={(e) => setEditData({ ...editData, nome_completo: e.target.value })}
              />
            ) : (
              <p className="text-muted-foreground">{creator.nome_completo}</p>
            )}
          </div>

          <div>
            <Label>Arroba Principal</Label>
            {editing ? (
              <Input
                value={editData.arroba_principal}
                onChange={(e) => setEditData({ ...editData, arroba_principal: e.target.value })}
              />
            ) : (
              <p className="text-primary">{creator.arroba_principal}</p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            {editing ? (
              <Input
                type="email"
                value={editData.email_contato}
                onChange={(e) => setEditData({ ...editData, email_contato: e.target.value })}
              />
            ) : (
              <p className="text-muted-foreground">{creator.email_contato}</p>
            )}
          </div>

          <div>
            <Label>Telefone</Label>
            {editing ? (
              <Input
                value={editData.telefone_contato}
                onChange={(e) => setEditData({ ...editData, telefone_contato: e.target.value })}
              />
            ) : (
              <p className="text-muted-foreground">{creator.telefone_contato}</p>
            )}
          </div>

          <div>
            <Label>Classificação</Label>
            {editing ? (
              <Select value={editData.classificacao_tier} onValueChange={(v) => setEditData({ ...editData, classificacao_tier: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Prata">Prata</SelectItem>
                  <SelectItem value="Ouro">Ouro</SelectItem>
                  <SelectItem value="Platina">Platina</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={getTierColor(creator.classificacao_tier)}>
                {creator.classificacao_tier}
              </Badge>
            )}
          </div>

          <div>
            <Label>Cupom Exclusivo</Label>
            {editing ? (
              <Input
                value={editData.cupom_exclusivo}
                onChange={(e) => setEditData({ ...editData, cupom_exclusivo: e.target.value })}
              />
            ) : (
              <p className="font-mono text-sm text-muted-foreground">{creator.cupom_exclusivo}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label>Endereço Completo</Label>
            {editing ? (
              <Textarea
                value={editData.endereco_completo}
                onChange={(e) => setEditData({ ...editData, endereco_completo: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground">{creator.endereco_completo}</p>
            )}
          </div>
        </div>
      </div>

      {/* Desempenho Financeiro */}
      <div className="card-neua p-6">
        <h2 className="text-2xl font-display font-bold mb-6">Desempenho Financeiro</h2>
        {desempenho.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum registro financeiro</p>
        ) : (
          <div className="space-y-4">
            {desempenho.slice(0, 5).map((desp) => (
              <div key={desp.id} className="border border-border/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {new Date(desp.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Badge variant="outline">{desp.status_pagamento}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pedidos</p>
                    <p className="font-semibold">{desp.vendas_pedidos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Vendido</p>
                    <p className="font-semibold text-green-400">
                      R$ {parseFloat(desp.valor_total_vendido).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comissão Base</p>
                    <p className="font-semibold">
                      R$ {parseFloat(desp.comissao_base).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comissão Total</p>
                    <p className="font-semibold text-primary">
                      R$ {parseFloat(desp.comissao_total_a_pagar).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Interações */}
      <div className="card-neua p-6">
        <h2 className="text-2xl font-display font-bold mb-6">Histórico de Interações</h2>
        {interacoes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma interação registrada</p>
        ) : (
          <div className="space-y-4">
            {interacoes.slice(0, 10).map((inter) => (
              <div key={inter.id} className="border-l-2 border-primary pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge variant="outline" className="mb-2">{inter.tipo_interacao}</Badge>
                    <h3 className="font-semibold">{inter.assunto_motivo}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inter.data_interacao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{inter.resumo_interacao}</p>
                {inter.proxima_acao_follow_up && (
                  <p className="text-sm">
                    <span className="font-semibold">Próxima ação:</span> {inter.proxima_acao_follow_up}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
