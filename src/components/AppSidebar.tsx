import { Target, Users, BarChart3, User, DollarSign, Package, MessageSquare, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
const metasItems = [{
  title: 'Resumo',
  url: '/dashboard',
  icon: BarChart3
}, {
  title: 'Metas',
  url: '/dashboard/metas',
  icon: Target
}, {
  title: 'Super Metas',
  url: '/dashboard/super-metas',
  icon: Target
}];
const creatorsItems = [{
  title: 'Resumo',
  url: '/creators',
  icon: BarChart3
}, {
  title: 'Registro',
  url: '/creators/registro',
  icon: User
}, {
  title: 'Desempenho & Financeiro',
  url: '/creators/desempenho',
  icon: DollarSign
}, {
  title: 'Logística & Conteúdo',
  url: '/creators/logistica',
  icon: Package
}, {
  title: 'Histórico de Interações',
  url: '/creators/interacoes',
  icon: MessageSquare
}];
export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const {
    open
  } = useSidebar();
  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (basePath: string) => location.pathname.startsWith(basePath);
  return <Sidebar className="m-2.5 rounded-2xl border border-border/50 bg-black">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 flex items-center justify-center">
            <img src={logo} alt="Neua" className="h-10 w-auto" />
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/dashboard')} isActive={isGroupActive('/dashboard')} className="font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Target className="h-5 w-5" />
                  {open && <span>Metas</span>}
                </SidebarMenuButton>
                {open && isGroupActive('/dashboard') && <SidebarMenuSub>
                    {metasItems.map(item => <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton onClick={() => navigate(item.url)} isActive={isActive(item.url)} className="hover:bg-primary hover:text-primary-foreground transition-colors">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>)}
                  </SidebarMenuSub>}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/creators')} isActive={isGroupActive('/creators')} className="font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Users className="h-5 w-5" />
                  {open && <span>Neua Creators</span>}
                </SidebarMenuButton>
                {open && isGroupActive('/creators') && <SidebarMenuSub>
                    {creatorsItems.map(item => <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton onClick={() => navigate(item.url)} isActive={isActive(item.url)} className="hover:bg-primary hover:text-primary-foreground transition-colors">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>)}
                  </SidebarMenuSub>}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-primary hover:text-primary-foreground transition-colors">
              <LogOut className="h-5 w-5" />
              {open && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>;
}