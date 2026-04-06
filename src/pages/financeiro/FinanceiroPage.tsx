import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceiroDashboard } from "@/components/financeiro/FinanceiroDashboard";
import { ReceitasList } from "@/components/financeiro/ReceitasList";
import { DespesasList } from "@/components/financeiro/DespesasList";
import { MarketingTab } from "@/components/financeiro/MarketingTab";
import { FluxoCaixaTab } from "@/components/financeiro/FluxoCaixaTab";
import { LucroMargemTab } from "@/components/financeiro/LucroMargemTab";
import { AnimatedGradientBackground } from "@/components/AnimatedGradientBackground";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Megaphone, 
  Wallet, 
  PieChart 
} from "lucide-react";

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "receitas", label: "Receitas", icon: TrendingUp },
    { id: "despesas", label: "Despesas", icon: TrendingDown },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "fluxo", label: "Fluxo de Caixa", icon: Wallet },
    { id: "lucro", label: "Lucro & Margem", icon: PieChart },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gestão financeira completa do seu e-commerce
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border/30 p-1 rounded-xl gap-1 h-auto grid grid-cols-3 lg:grid-cols-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <FinanceiroDashboard />
          </TabsContent>

          <TabsContent value="receitas" className="mt-6">
            <ReceitasList />
          </TabsContent>

          <TabsContent value="despesas" className="mt-6">
            <DespesasList />
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <MarketingTab />
          </TabsContent>

          <TabsContent value="fluxo" className="mt-6">
            <FluxoCaixaTab />
          </TabsContent>

          <TabsContent value="lucro" className="mt-6">
            <LucroMargemTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
