import { useState, useEffect } from 'react';
import { LogOut, PanelLeftClose, PanelLeft, Calendar, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/components/ui/sidebar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { menuItems, metasSubmenu, creatorsSubmenu, kpisSubmenu, type MenuItem } from '@/config/sidebarMenu';
import { SidebarSubmenu } from '@/components/sidebar/SidebarSubmenu';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { open, setOpen, isMobile } = useSidebar();

  const isActive = (basePath: string) => location.pathname.startsWith(basePath);
  
  const currentDate = format(new Date(), "dd MMM, yyyy", { locale: ptBR });

  // Sidebar dimensions
  const sidebarWidth = open ? 260 : 64;

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
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-[30px] top-[30px] z-50 flex flex-col rounded-2xl border border-white/[0.04] backdrop-blur-xl"
      style={{
        height: 'calc(100vh - 60px)',
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
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
  const [metasMenuOpen, setMetasMenuOpen] = useState(false);
  const [creatorsMenuOpen, setCreatorsMenuOpen] = useState(false);
  const [kpisMenuOpen, setKpisMenuOpen] = useState(false);

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

  // Auto-expand menus if on their routes
  useEffect(() => {
    if (location.pathname.startsWith('/workspace')) {
      setWorkspaceMenuOpen(true);
    }
    if (location.pathname.startsWith('/dashboard')) {
      setMetasMenuOpen(true);
    }
    if (location.pathname.startsWith('/creators')) {
      setCreatorsMenuOpen(true);
    }
    if (location.pathname.startsWith('/kpis')) {
      setKpisMenuOpen(true);
    }
  }, [location.pathname]);

  const handleMenuClick = (item: MenuItem) => {
    if (item.hasSubmenu && open) {
      if (item.basePath === '/workspace') {
        setWorkspaceMenuOpen(!workspaceMenuOpen);
      } else if (item.basePath === '/dashboard') {
        setMetasMenuOpen(!metasMenuOpen);
      } else if (item.basePath === '/creators') {
        setCreatorsMenuOpen(!creatorsMenuOpen);
      } else if (item.basePath === '/kpis') {
        setKpisMenuOpen(!kpisMenuOpen);
      }
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
      <nav className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {menuItems.map((item, index) => {
          const active = isActive(item.basePath);
          const isWorkspaceItem = item.basePath === '/workspace';
          const isMetasItem = item.basePath === '/dashboard';
          const isCreatorsItem = item.basePath === '/creators';
          const isKpisItem = item.basePath === '/kpis';
          const showSubmenu = item.hasSubmenu && open && (
            (isWorkspaceItem && workspaceMenuOpen) || (isMetasItem && metasMenuOpen) || (isCreatorsItem && creatorsMenuOpen) || (isKpisItem && kpisMenuOpen)
          );
          const submenuOpen = isWorkspaceItem ? workspaceMenuOpen : isMetasItem ? metasMenuOpen : isCreatorsItem ? creatorsMenuOpen : isKpisItem ? kpisMenuOpen : false;

          return (
            <div key={item.url}>
              {item.section && open && (
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-foreground/40">
                  {item.section}
                </div>
              )}
              {item.section && !open && index > 0 && (
                <div className="my-2 mx-2 h-px bg-border/40" />
              )}
              <motion.button
                onClick={() => handleMenuClick(item)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`
                  w-full h-10 rounded-[10px] flex items-center gap-3 transition-colors duration-150
                  ${active
                    ? 'bg-primary/[0.12] text-primary border-l-2 border-primary'
                    : 'text-foreground/50 hover:bg-white/[0.04] hover:text-foreground/85'
                  }
                  ${open ? 'px-3 justify-start' : 'px-0 justify-center border-l-0'}
                `}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {open && (
                    <>
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="font-medium text-sm whitespace-nowrap overflow-hidden flex-1 text-left"
                      >
                        {item.title}
                      </motion.span>
                      {item.hasSubmenu && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, rotate: submenuOpen ? 0 : -90 }}
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
              {isWorkspaceItem && (
                <SidebarSubmenu
                  open={!!showSubmenu}
                  items={[
                    { label: 'Resumo', path: '/workspace' },
                    ...workspaces.map((w) => ({ label: w.name, path: `/workspace/${w.id}` })),
                  ]}
                  onNavigate={(p) => { navigate(p); if (isMobile) setOpen(false); }}
                  emptyMessage="Nenhum workspace criado"
                />
              )}

              {/* Metas Submenu */}
              {isMetasItem && (
                <SidebarSubmenu
                  open={!!showSubmenu}
                  items={metasSubmenu}
                  onNavigate={(p) => { navigate(p); if (isMobile) setOpen(false); }}
                />
              )}

              {/* Creators Submenu */}
              {isCreatorsItem && (
                <SidebarSubmenu
                  open={!!showSubmenu}
                  items={creatorsSubmenu}
                  onNavigate={(p) => { navigate(p); if (isMobile) setOpen(false); }}
                />
              )}

              {/* KPIs Submenu */}
              {isKpisItem && (
                <SidebarSubmenu
                  open={!!showSubmenu}
                  items={kpisSubmenu}
                  onNavigate={(p) => { navigate(p); if (isMobile) setOpen(false); }}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer - User Card */}
      <div className="mt-auto pt-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />
        {open ? (
          <div className="rounded-xl bg-secondary border border-border/50 p-2.5 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
              N
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Neua</p>
              <p className="text-[11px] text-foreground/55 truncate">@neua.co</p>
            </div>
            <motion.button
              onClick={signOut}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-foreground/60 hover:bg-destructive hover:text-destructive-foreground transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={signOut}
            className="w-full h-11 rounded-xl bg-secondary text-foreground/70 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}