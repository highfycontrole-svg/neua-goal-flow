import { Target, Users, LayoutGrid, Calculator, LogOut, PanelLeftClose, PanelLeft, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'Metas',
    url: '/dashboard',
    icon: Target,
    basePath: '/dashboard',
  },
  {
    title: 'Neua Creators',
    url: '/creators',
    icon: Users,
    basePath: '/creators',
  },
  {
    title: 'Workspace Neua',
    url: '/workspace',
    icon: LayoutGrid,
    basePath: '/workspace',
  },
  {
    title: 'Precificação & Catálogo',
    url: '/pricing',
    icon: Calculator,
    basePath: '/pricing',
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { open, setOpen, isMobile } = useSidebar();

  const isActive = (basePath: string) => location.pathname.startsWith(basePath);
  
  const currentDate = format(new Date(), "dd MMM, yyyy", { locale: ptBR });

  return (
    <Sidebar
      className={`
        fixed left-0 top-0 h-screen z-50
        ${isMobile 
          ? 'w-[280px]' 
          : open 
            ? 'w-[350px] ml-[30px] my-[30px] h-[calc(100vh-60px)]' 
            : 'w-[70px] ml-[30px] my-[30px] h-[calc(100vh-60px)]'
        }
        bg-background border-none
        transition-all duration-300 ease-out
      `}
      collapsible="icon"
    >
      <SidebarContent className="px-4 py-6 flex flex-col h-full">
        {/* Header */}
        <SidebarGroup className="mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.img 
                src={logo} 
                alt="Neua" 
                className={`${open ? 'h-10' : 'h-8'} w-auto transition-all duration-300`}
                whileHover={{ scale: 1.05 }}
              />
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col"
                  >
                    <span className="font-display font-semibold text-foreground text-lg">Neua</span>
                    <span className="text-xs text-muted-foreground">@neua.co</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {!isMobile && (
              <motion.button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
              </motion.button>
            )}
          </div>
        </SidebarGroup>

        {/* Divider */}
        <div className="divider-neua my-4" />

        {/* Welcome Message */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-2 mb-6"
            >
              <p className="text-foreground font-medium">Bem-vindo de volta, <span className="text-primary">Neua</span></p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="capitalize">{currentDate}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Items */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item, index) => {
                const active = isActive(item.basePath);
                return (
                  <SidebarMenuItem key={item.url}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SidebarMenuButton
                        onClick={() => navigate(item.url)}
                        className={`
                          w-full h-12 rounded-xl transition-all duration-300
                          ${active 
                            ? 'bg-primary text-primary-foreground shadow-lg' 
                            : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-lg'
                          }
                          ${open ? 'px-4' : 'px-3 justify-center'}
                        `}
                        style={{
                          boxShadow: active ? '0 0 25px hsl(217 91% 60% / 0.4)' : undefined,
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <item.icon className={`${open ? 'h-5 w-5' : 'h-6 w-6'}`} />
                        </motion.div>
                        {open && (
                          <span className="ml-3 font-medium truncate">{item.title}</span>
                        )}
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer - Logout */}
        <SidebarFooter className="mt-auto pt-4">
          <div className="divider-neua mb-4" />
          <motion.button
            onClick={signOut}
            className={`
              w-full h-12 rounded-xl bg-secondary text-foreground
              flex items-center gap-3 transition-all duration-300
              hover:bg-destructive hover:text-destructive-foreground
              ${open ? 'px-4 justify-start' : 'px-3 justify-center'}
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className={`${open ? 'h-5 w-5' : 'h-6 w-6'}`} />
            {open && <span className="font-medium">Sair</span>}
          </motion.button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
