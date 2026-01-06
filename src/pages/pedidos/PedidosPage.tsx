import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { PedidosList } from "@/components/pedidos/PedidosList";
import { PedidosMetricas } from "@/components/pedidos/PedidosMetricas";

const PedidosPage = () => {
  const [activeTab, setActiveTab] = useState("lista");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Pedidos
          </h1>
          <p className="text-muted-foreground">
            Acompanhamento e gestão de pedidos
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="lista" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Lista de Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="metricas" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Métricas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
            <PedidosList />
          </TabsContent>

          <TabsContent value="metricas">
            <PedidosMetricas />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default PedidosPage;
