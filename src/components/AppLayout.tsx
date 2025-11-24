import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import logo from '@/assets/logo.png';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="glass-morphism sticky top-0 z-40 border-b border-border/50">
            <div className="container mx-auto px-4 h-16 flex items-center gap-4">
              <SidebarTrigger className="-ml-2" />
              <div className="flex items-center gap-3">
                <img src={logo} alt="Neua Logo" className="h-10 w-auto" />
                <div>
                  <h1 className="font-display text-xl font-extrabold">Neua</h1>
                  <p className="text-xs text-muted-foreground">
                    Seu Ambiente. <span className="font-bold">Sua Assinatura</span>
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
