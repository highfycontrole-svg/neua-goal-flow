import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Target, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';
interface DashboardLayoutProps {
  children: ReactNode;
}
export function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const {
    signOut,
    user
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return <div className="min-h-screen bg-background">
      {/* Glass Morphism Header */}
      <header className="glass-morphism sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-center relative">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Neua Logo" className="h-12 w-auto" />
            <div>
              <h1 className="font-display text-2xl font-extrabold text-center">Neua</h1>
              <p className="text-sm text-muted-foreground">
                Seu Ambiente. <span className="font-bold">Sua Assinatura</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 absolute right-4">
            <Button variant={location.pathname === '/dashboard' ? 'default' : 'outline'} size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Metas</span>
            </Button>
            <Button variant={location.pathname === '/arquitetos' ? 'default' : 'outline'} size="sm" onClick={() => navigate('/arquitetos')} className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Creators</span>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2 backdrop-blur-sm">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.3
    }} className="container mx-auto px-4 py-8">
        {children}
      </motion.main>
    </div>;
}