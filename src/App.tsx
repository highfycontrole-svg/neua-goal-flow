import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Eager — entry & auth (small, needed immediately)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy — every other page becomes its own chunk
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MetasPage = lazy(() => import("./pages/metas/MetasPage"));
const SuperMetasPage = lazy(() => import("./pages/metas/SuperMetasPage"));
const CreatorsResumo = lazy(() => import("./pages/creators/CreatorsResumo"));
const CreatorsRegistro = lazy(() => import("./pages/creators/CreatorsRegistro"));
const CreatorsDesempenho = lazy(() => import("./pages/creators/CreatorsDesempenho"));
const CreatorsLogistica = lazy(() => import("./pages/creators/CreatorsLogistica"));
const CreatorsInteracoes = lazy(() => import("./pages/creators/CreatorsInteracoes"));
const CreatorDetalhes = lazy(() => import("./pages/creators/CreatorDetalhes"));
const WorkspaceResumo = lazy(() => import("./pages/workspace/WorkspaceResumo"));
const WorkspaceDetalhe = lazy(() => import("./pages/workspace/WorkspaceDetalhe"));
const PricingPage = lazy(() => import("./pages/pricing/PricingPage"));
const Planner2026Page = lazy(() => import("./pages/planner/Planner2026Page"));
const PlannerCalendarioPage = lazy(() => import("./pages/planner/PlannerCalendarioPage"));
const PlannerIdeiasPage = lazy(() => import("./pages/planner/PlannerIdeiasPage"));
const PlannerManualPage = lazy(() => import("./pages/planner/PlannerManualPage"));
const PedidosPage = lazy(() => import("./pages/pedidos/PedidosPage"));
const FinanceiroPage = lazy(() => import("./pages/financeiro/FinanceiroPage"));
const GeralPage = lazy(() => import("./pages/geral/GeralPage"));
const AdLabPage = lazy(() => import("./pages/adlab/AdLabPage"));
const AdLabPacksPage = lazy(() => import("./pages/adlab/AdLabPacksPage"));
const AdLabAnunciosPage = lazy(() => import("./pages/adlab/AdLabAnunciosPage"));
const MindOsPage = lazy(() => import("./pages/mindos/MindOsPage"));
const MindMapProjectsPage = lazy(() => import("./pages/mindos/MindMapProjectsPage"));
const FlowchartProjectsPage = lazy(() => import("./pages/mindos/FlowchartProjectsPage"));
const MindMapEditor = lazy(() => import("./components/mindos/MindMapEditor"));
const FlowchartEditor = lazy(() => import("./components/mindos/FlowchartEditor"));
const UTMBuilderPage = lazy(() => import("./pages/utm/UTMBuilderPage"));
const AdsNeuaPage = lazy(() => import("./pages/ads/AdsNeuaPage"));
const AdsNeuaCallback = lazy(() => import("./pages/ads/AdsNeuaCallback"));
const KpisPage = lazy(() => import("./pages/kpis/KpisPage"));
const ManychatKpiPage = lazy(() => import("./pages/kpis/ManychatKpiPage"));
const GrupoVipKpiPage = lazy(() => import("./pages/kpis/GrupoVipKpiPage"));
const GravacoesPage = lazy(() => import("./pages/gravacoes/GravacoesPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageFallback = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="md" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/geral" element={<ProtectedRoute><AppLayout><GeralPage /></AppLayout></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/dashboard/metas" element={<ProtectedRoute><AppLayout><MetasPage /></AppLayout></ProtectedRoute>} />
              <Route path="/dashboard/super-metas" element={<ProtectedRoute><AppLayout><SuperMetasPage /></AppLayout></ProtectedRoute>} />
              <Route path="/creators" element={<ProtectedRoute><AppLayout><CreatorsResumo /></AppLayout></ProtectedRoute>} />
              <Route path="/creators/registro" element={<ProtectedRoute><AppLayout><CreatorsRegistro /></AppLayout></ProtectedRoute>} />
              <Route path="/creators/desempenho" element={<ProtectedRoute><AppLayout><CreatorsDesempenho /></AppLayout></ProtectedRoute>} />
              <Route path="/creators/logistica" element={<ProtectedRoute><AppLayout><CreatorsLogistica /></AppLayout></ProtectedRoute>} />
              <Route path="/creators/interacoes" element={<ProtectedRoute><AppLayout><CreatorsInteracoes /></AppLayout></ProtectedRoute>} />
              <Route path="/creators/:id" element={<ProtectedRoute><AppLayout><CreatorDetalhes /></AppLayout></ProtectedRoute>} />
              <Route path="/workspace" element={<ProtectedRoute><AppLayout><WorkspaceResumo /></AppLayout></ProtectedRoute>} />
              <Route path="/workspace/:id" element={<ProtectedRoute><AppLayout><WorkspaceDetalhe /></AppLayout></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><AppLayout><PricingPage /></AppLayout></ProtectedRoute>} />
              <Route path="/planner" element={<ProtectedRoute><AppLayout><Planner2026Page /></AppLayout></ProtectedRoute>}>
                <Route path="calendario" element={<PlannerCalendarioPage />} />
                <Route path="ideias" element={<PlannerIdeiasPage />} />
                <Route path="manual" element={<PlannerManualPage />} />
              </Route>
              <Route path="/pedidos" element={<ProtectedRoute><AppLayout><PedidosPage /></AppLayout></ProtectedRoute>} />
              <Route path="/adlab" element={<ProtectedRoute><AppLayout><AdLabPage /></AppLayout></ProtectedRoute>} />
              <Route path="/adlab/:produtoId" element={<ProtectedRoute><AppLayout><AdLabPacksPage /></AppLayout></ProtectedRoute>} />
              <Route path="/adlab/:produtoId/pack/:packId" element={<ProtectedRoute><AppLayout><AdLabAnunciosPage /></AppLayout></ProtectedRoute>} />
              <Route path="/mindos" element={<ProtectedRoute><AppLayout><MindOsPage /></AppLayout></ProtectedRoute>}>
                <Route index element={<MindMapProjectsPage />} />
                <Route path="mindmap" element={<MindMapProjectsPage />} />
                <Route path="flowchart" element={<FlowchartProjectsPage />} />
              </Route>
              <Route path="/mindos/mindmap/:projectId" element={<ProtectedRoute><AppLayout><MindMapEditor /></AppLayout></ProtectedRoute>} />
              <Route path="/mindos/flowchart/:projectId" element={<ProtectedRoute><AppLayout><FlowchartEditor /></AppLayout></ProtectedRoute>} />
              <Route path="/financeiro" element={<ProtectedRoute><AppLayout><FinanceiroPage /></AppLayout></ProtectedRoute>} />
              <Route path="/utm" element={<ProtectedRoute><AppLayout><UTMBuilderPage /></AppLayout></ProtectedRoute>} />
              <Route path="/ads-neua" element={<ProtectedRoute><AppLayout><AdsNeuaPage /></AppLayout></ProtectedRoute>} />
              <Route path="/ads-neua/callback" element={<ProtectedRoute><AdsNeuaCallback /></ProtectedRoute>} />
              <Route path="/kpis" element={<ProtectedRoute><AppLayout><KpisPage /></AppLayout></ProtectedRoute>} />
              <Route path="/kpis/manychat" element={<ProtectedRoute><AppLayout><ManychatKpiPage /></AppLayout></ProtectedRoute>} />
              <Route path="/kpis/grupo-vip" element={<ProtectedRoute><AppLayout><GrupoVipKpiPage /></AppLayout></ProtectedRoute>} />
              <Route path="/gravacoes" element={<ProtectedRoute><AppLayout><GravacoesPage /></AppLayout></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
