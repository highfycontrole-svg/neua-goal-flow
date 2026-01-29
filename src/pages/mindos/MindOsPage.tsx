import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Brain, GitBranch, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function MindOsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentTab = location.pathname.includes('/mindos/flowchart') 
    ? 'flowchart' 
    : 'mindmap';

  const handleTabChange = (value: string) => {
    navigate(`/mindos/${value}`);
  };

  return (
    <div className="min-h-screen bg-[#161616]">
      <div className="floating-content bg-[#242424] rounded-[18px] min-h-[calc(100vh-60px)]">
        {/* Header */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20"
              >
                <Brain className="h-6 w-6 text-purple-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  MindOs
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema avançado de pensamento visual e estratégia
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="bg-[#161616] p-1">
              <TabsTrigger 
                value="mindmap" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Brain className="h-4 w-4" />
                Mind Map
              </TabsTrigger>
              <TabsTrigger 
                value="flowchart" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <GitBranch className="h-4 w-4" />
                Flowchart Funnels
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
