import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { PedidosList } from "@/components/pedidos/PedidosList";
import { PedidosMetricas } from "@/components/pedidos/PedidosMetricas";

const PedidosPage = () => {
  const [activeTab, setActiveTab] = useState("lista");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhamento e gestão de pedidos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border/30 p-1 rounded-xl gap-1 h-auto w-full max-w-md grid grid-cols-2">
          <TabsTrigger 
            value="lista" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <Package className="h-4 w-4" />
            <span>Lista de Pedidos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="metricas" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Métricas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-6">
          <PedidosList />
        </TabsContent>

        <TabsContent value="metricas" className="mt-6">
          <PedidosMetricas />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default PedidosPage;
