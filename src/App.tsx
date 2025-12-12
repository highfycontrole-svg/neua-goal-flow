import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MetasPage from "./pages/metas/MetasPage";
import SuperMetasPage from "./pages/metas/SuperMetasPage";
import CreatorsResumo from "./pages/creators/CreatorsResumo";
import CreatorsRegistro from "./pages/creators/CreatorsRegistro";
import CreatorsDesempenho from "./pages/creators/CreatorsDesempenho";
import CreatorsLogistica from "./pages/creators/CreatorsLogistica";
import CreatorsInteracoes from "./pages/creators/CreatorsInteracoes";
import CreatorDetalhes from "./pages/creators/CreatorDetalhes";
import WorkspaceResumo from "./pages/workspace/WorkspaceResumo";
import WorkspaceDetalhe from "./pages/workspace/WorkspaceDetalhe";
import PricingPage from "./pages/pricing/PricingPage";
import Planner2026Page from "./pages/planner/Planner2026Page";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/metas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MetasPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/super-metas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SuperMetasPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/creators"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatorsResumo />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/creators/registro"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatorsRegistro />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/creators/desempenho"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatorsDesempenho />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/creators/logistica"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatorsLogistica />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/creators/interacoes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatorsInteracoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/creators/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatorDetalhes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WorkspaceResumo />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WorkspaceDetalhe />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PricingPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/planner"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Planner2026Page />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
