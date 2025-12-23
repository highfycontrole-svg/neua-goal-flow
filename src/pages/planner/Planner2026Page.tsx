import { Bot, PenLine } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlannerIATab } from '@/components/planner/PlannerIATab';
import { ManualPlannerList } from '@/components/planner/manual/ManualPlannerList';
import { motion } from 'framer-motion';

export default function Planner2026Page() {
  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      <Tabs defaultValue="ia" className="flex flex-col h-full">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 mb-4"
        >
          <TabsList className="bg-[#1a1a1a] border border-border/30 p-1 h-auto">
            <TabsTrigger 
              value="ia" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Planner IA</span>
              <span className="sm:hidden">IA</span>
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
            >
              <PenLine className="h-4 w-4" />
              <span className="hidden sm:inline">Planner Manual</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Tab Content */}
        <TabsContent value="ia" className="flex-1 mt-0 min-h-0">
          <PlannerIATab />
        </TabsContent>
        
        <TabsContent value="manual" className="flex-1 mt-0 min-h-0">
          <ManualPlannerList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
