import { useState, useEffect } from 'react';
import { Target, Users, LayoutGrid, Calculator, LogOut, PanelLeftClose, PanelLeft, Calendar, Rocket, ChevronDown, ChevronRight, Package, DollarSign, Home, PlayCircle, Brain } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/components/ui/sidebar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  basePath: string;
  hasSubmenu?: boolean;
}

const menuItems: MenuItem[] = [
  {
    title: 'Geral',
    url: '/geral',
    icon: Home,
    basePath: '/geral',
  },
  {
    title: 'Workspace',
    url: '/workspace',
    icon: LayoutGrid,
    basePath: '/workspace',
    hasSubmenu: true,
  },
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: DollarSign,
    basePath: '/financeiro',
  },
  {
    title: 'Pedidos',
    url: '/pedidos',
    icon: Package,
    basePath: '/pedidos',
  },
  {
    title: 'Catálogo',
    url: '/pricing',
    icon: Calculator,
    basePath: '/pricing',
  },
  {
    title: 'AD Lab',
    url: '/adlab',
    icon: PlayCircle,
    basePath: '/adlab',
  },
  {
    title: 'MindOs',
    url: '/mindos',
    icon: Brain,
    basePath: '/mindos',
  },
  {
    title: 'Metas',
    url: '/dashboard',
    icon: Target,
    basePath: '/dashboard',
  },
  {
    title: 'Planner',
    url: '/planner',
    icon: Rocket,
    basePath: '/planner',
  },
  {
    title: 'Creators',
    url: '/creators',
    icon: Users,
    basePath: '/creators',
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { open, setOpen, isMobile } = useSidebar();

  const isActive = (basePath: string) => location.pathname.startsWith(basePath);
  
  const currentDate = format(new Date(), "dd MMM, yyyy", { locale: ptBR });

  // Sidebar dimensions
  const sidebarWidth = open ? 320 : 80;

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-[280px] z-50 bg-background p-4 flex flex-col"
            >
              <SidebarContent 
                open={true} 
                setOpen={setOpen} 
                isActive={isActive} 
                navigate={navigate} 
                signOut={signOut} 
                currentDate={currentDate}
                isMobile={true}
                userId={user?.id}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-[30px] top-[30px] z-50 flex flex-col"
      style={{ 
        height: 'calc(100vh - 60px)',
        backgroundColor: '#161616',
      }}
    >
      <SidebarContent 
        open={open} 
        setOpen={setOpen} 
        isActive={isActive} 
        navigate={navigate} 
        signOut={signOut} 
        currentDate={currentDate}
        isMobile={false}
        userId={user?.id}
      />
    </motion.aside>
  );
}

interface SidebarContentProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive: (basePath: string) => boolean;
  navigate: (url: string) => void;
  signOut: () => void;
  currentDate: string;
  isMobile: boolean;
  userId?: string;
}

function SidebarContent({ open, setOpen, isActive, navigate, signOut, currentDate, isMobile, userId }: SidebarContentProps) {
  const location = useLocation();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  // Fetch workspaces for the submenu
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Auto-expand workspace menu if on workspace route
  useEffect(() => {
    if (location.pathname.startsWith('/workspace')) {
      setWorkspaceMenuOpen(true);
    }
  }, [location.pathname]);

  const handleMenuClick = (item: MenuItem) => {
    if (item.hasSubmenu && open) {
      setWorkspaceMenuOpen(!workspaceMenuOpen);
      navigate(item.url);
    } else {
      navigate(item.url);
      if (isMobile) setOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full py-4 px-3">
      {/* Header */}
      <div className={`flex items-center mb-2 ${open ? 'justify-between' : 'justify-center'}`}>
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 min-w-0"
            >
              <motion.img 
                src={logo} 
                alt="Neua" 
                className="h-9 w-9 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-display font-semibold text-foreground text-lg whitespace-nowrap">Neua</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">@neua.co</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isMobile && (
          <motion.button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200 flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </motion.button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />

      {/* Welcome Message */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-1 mb-6 overflow-hidden"
          >
            <p className="text-foreground font-medium text-sm">
              Bem-vindo de volta, <span className="text-primary">Neua</span>
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span className="capitalize">{currentDate}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item, index) => {
          const active = isActive(item.basePath);
          const showSubmenu = item.hasSubmenu && workspaceMenuOpen && open;
          
          return (
            <div key={item.url}>
              <motion.button
                onClick={() => handleMenuClick(item)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  w-full h-12 rounded-xl flex items-center gap-3 transition-all duration-300
                  ${active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                  ${open ? 'px-4 justify-start' : 'px-0 justify-center'}
                `}
                style={{
                  boxShadow: active ? '0 0 25px hsl(217 91% 60% / 0.4)' : undefined,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {open && (
                    <>
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium text-sm whitespace-nowrap overflow-hidden flex-1 text-left"
                      >
                        {item.title}
                      </motion.span>
                      {item.hasSubmenu && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, rotate: workspaceMenuOpen ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </motion.button>
              
              {/* Workspace Submenu */}
              <AnimatePresence>
                {showSubmenu && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 mt-1 space-y-1 overflow-hidden"
                  >
                    {/* Resumo/Dashboard link */}
                    <motion.button
                      onClick={() => {
                        navigate('/workspace');
                        if (isMobile) setOpen(false);
                      }}
                      className={`
                        w-full h-9 rounded-lg flex items-center gap-2 px-3 text-sm transition-all
                        ${location.pathname === '/workspace' 
                          ? 'bg-primary/20 text-primary' 
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }
                      `}
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                      <span>Resumo</span>
                    </motion.button>
                    
                    {/* Individual workspaces */}
                    {workspaces.map((workspace) => {
                      const isWorkspaceActive = location.pathname === `/workspace/${workspace.id}`;
                      return (
                        <motion.button
                          key={workspace.id}
                          onClick={() => {
                            navigate(`/workspace/${workspace.id}`);
                            if (isMobile) setOpen(false);
                          }}
                          className={`
                            w-full h-9 rounded-lg flex items-center gap-2 px-3 text-sm transition-all
                            ${isWorkspaceActive 
                              ? 'bg-primary/20 text-primary' 
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }
                          `}
                          whileHover={{ x: 4 }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                          <span className="truncate">{workspace.name}</span>
                        </motion.button>
                      );
                    })}
                    
                    {workspaces.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground italic">
                        Nenhum workspace criado
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="mt-auto pt-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
        <motion.button
          onClick={signOut}
          className={`
            w-full h-12 rounded-xl bg-secondary text-foreground
            flex items-center gap-3 transition-all duration-300
            hover:bg-destructive hover:text-destructive-foreground
            ${open ? 'px-4 justify-start' : 'px-0 justify-center'}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {open && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium text-sm whitespace-nowrap overflow-hidden"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}