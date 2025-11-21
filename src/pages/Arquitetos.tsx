import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegistroArquitetos } from '@/components/arquitetos/RegistroArquitetos';
import { DesempenhoFinanceiro } from '@/components/arquitetos/DesempenhoFinanceiro';
import { LogisticaConteudo } from '@/components/arquitetos/LogisticaConteudo';
import { HistoricoInteracoes } from '@/components/arquitetos/HistoricoInteracoes';
import { ArquitetosKPIs } from '@/components/arquitetos/ArquitetosKPIs';

export default function Arquitetos() {
  const [selectedArquiteto, setSelectedArquiteto] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Arquitetos de Conteúdo</h1>
          <p className="text-muted-foreground">
            Gerencie seus criadores de conteúdo, acompanhe desempenho e controle obrigações.
          </p>
        </div>

        <ArquitetosKPIs />

        <Tabs defaultValue="registro" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="registro">Registro</TabsTrigger>
            <TabsTrigger value="desempenho">Desempenho & Financeiro</TabsTrigger>
            <TabsTrigger value="logistica">Logística & Conteúdo</TabsTrigger>
            <TabsTrigger value="interacoes">Histórico de Interações</TabsTrigger>
          </TabsList>

          <TabsContent value="registro" className="mt-6">
            <RegistroArquitetos onSelectArquiteto={setSelectedArquiteto} />
          </TabsContent>

          <TabsContent value="desempenho" className="mt-6">
            <DesempenhoFinanceiro selectedArquitetoId={selectedArquiteto} />
          </TabsContent>

          <TabsContent value="logistica" className="mt-6">
            <LogisticaConteudo selectedArquitetoId={selectedArquiteto} />
          </TabsContent>

          <TabsContent value="interacoes" className="mt-6">
            <HistoricoInteracoes selectedArquitetoId={selectedArquiteto} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
