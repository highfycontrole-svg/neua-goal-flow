import { useState } from 'react';
import { Building2, Megaphone, LayoutGrid, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

type PlannerType = 'anual' | 'campanha' | 'trimestral';

interface CreateManualPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePlanner: (nome: string, tipo: PlannerType) => Promise<void>;
}

const plannerTypes = [
  {
    id: 'anual' as PlannerType,
    title: 'Planejamento Anual',
    subtitle: 'Empresa',
    description: 'Layout focado em planejamento macro do negócio para o ano inteiro.',
    icon: Building2,
  },
  {
    id: 'campanha' as PlannerType,
    title: 'Planejamento de Campanha',
    subtitle: 'Marketing',
    description: 'Layout focado em campanhas específicas, lançamentos e ações pontuais.',
    icon: Megaphone,
  },
  {
    id: 'trimestral' as PlannerType,
    title: 'Planner Trimestral',
    subtitle: 'Q1 · Q2 · Q3 · Q4',
    description: 'Planejamento estruturado por trimestre, com metas, KPIs, calendário e planos de ação por área.',
    icon: LayoutGrid,
  },
];

export function CreateManualPlannerDialog({ 
  open, 
  onOpenChange, 
  onCreatePlanner 
}: CreateManualPlannerDialogProps) {
  const [step, setStep] = useState<'type' | 'name'>('type');
  const [selectedType, setSelectedType] = useState<PlannerType | null>(null);
  const [plannerName, setPlannerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectType = (type: PlannerType) => {
    setSelectedType(type);
    setStep('name');
  };

  const handleCreate = async () => {
    if (!selectedType || !plannerName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreatePlanner(plannerName.trim(), selectedType);
      handleClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setPlannerName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' ? 'Escolha o Tipo de Planner' : 'Nome do Planejamento'}
          </DialogTitle>
        </DialogHeader>

        {step === 'type' ? (
          <div className="grid gap-4 py-4">
            {plannerTypes.map((type, index) => (
              <motion.button
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectType(type.id)}
                className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <type.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{type.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      {type.subtitle}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planner-name">Nome do Planejamento</Label>
              <Input
                id="planner-name"
                value={plannerName}
                onChange={(e) => setPlannerName(e.target.value)}
                placeholder={selectedType === 'anual' ? 'Ex: Planejamento 2026' : 'Ex: Black Friday 2026'}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('type')}>
                Voltar
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!plannerName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  'Criar Planejamento'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
