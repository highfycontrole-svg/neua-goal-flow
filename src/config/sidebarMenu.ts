import { Target, Users, LayoutGrid, Calculator, Rocket, Package, DollarSign, Home, PlayCircle, Brain, Link2, BarChart3, BarChart2 } from 'lucide-react';

export interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  basePath: string;
  hasSubmenu?: boolean;
  section?: string;
}

export const menuItems: MenuItem[] = [
  // GERAL
  { title: 'Geral', url: '/geral', icon: Home, basePath: '/geral', section: 'GERAL' },

  // OPERACIONAL
  { title: 'Workspace', url: '/workspace', icon: LayoutGrid, basePath: '/workspace', hasSubmenu: true, section: 'OPERACIONAL' },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign, basePath: '/financeiro' },
  { title: 'Pedidos', url: '/pedidos', icon: Package, basePath: '/pedidos' },
  { title: 'Catálogo', url: '/pricing', icon: Calculator, basePath: '/pricing' },

  // MARKETING
  { title: 'AD Lab', url: '/adlab', icon: PlayCircle, basePath: '/adlab', section: 'MARKETING' },
  { title: 'Ads Neua', url: '/ads-neua', icon: BarChart3, basePath: '/ads-neua' },
  { title: 'KPIs', url: '/kpis', icon: BarChart2, basePath: '/kpis', hasSubmenu: true },
  { title: 'UTM Builder', url: '/utm', icon: Link2, basePath: '/utm' },

  // DADOS
  { title: 'MindOs', url: '/mindos', icon: Brain, basePath: '/mindos', section: 'DADOS' },
  { title: 'Metas', url: '/dashboard', icon: Target, basePath: '/dashboard', hasSubmenu: true },

  // CONTEÚDO
  { title: 'Planner', url: '/planner', icon: Rocket, basePath: '/planner', section: 'CONTEÚDO' },
  { title: 'Creators', url: '/creators', icon: Users, basePath: '/creators', hasSubmenu: true },
];

export interface SubmenuEntry {
  label: string;
  path: string;
}

export const metasSubmenu: SubmenuEntry[] = [
  { label: 'Resumo', path: '/dashboard' },
  { label: 'Metas', path: '/dashboard/metas' },
  { label: 'Super Metas', path: '/dashboard/super-metas' },
];

export const creatorsSubmenu: SubmenuEntry[] = [
  { label: 'Resumo', path: '/creators' },
  { label: 'Registro', path: '/creators/registro' },
  { label: 'Desempenho', path: '/creators/desempenho' },
  { label: 'Logística', path: '/creators/logistica' },
  { label: 'Interações', path: '/creators/interacoes' },
];

export const kpisSubmenu: SubmenuEntry[] = [
  { label: 'Visão Geral', path: '/kpis' },
  { label: 'ManyChat', path: '/kpis/manychat' },
  { label: 'Grupo VIP', path: '/kpis/grupo-vip' },
];