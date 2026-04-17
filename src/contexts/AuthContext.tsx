import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Use APENAS onAuthStateChange como fonte de verdade.
    // O evento INITIAL_SESSION é disparado no primeiro registro com a sessão atual,
    // eliminando a race condition entre getSession() e onAuthStateChange().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Timeout de segurança: se o Supabase não responder em 8s,
    // libera a UI para evitar tela branca infinita.
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.session) {
        // Atualiza estado imediatamente; navegação é feita no Auth.tsx via useEffect
        setSession(data.session);
        setUser(data.session.user);
      } else if (error) {
        const msg = error.message.includes('Invalid login credentials')
          ? 'Email ou senha incorretos'
          : error.message.includes('Email not confirmed')
          ? 'Confirme seu email antes de entrar'
          : error.message.includes('Too many requests')
          ? 'Muitas tentativas. Aguarde alguns minutos'
          : 'Erro ao fazer login. Tente novamente';
        toast.error(msg);
      }
      return { error };
    } catch (e: any) {
      const msg = e?.message?.includes('fetch')
        ? 'Erro de conexão. Verifique sua internet e tente novamente'
        : 'Erro inesperado. Tente novamente';
      toast.error(msg);
      return { error: e };
    }
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/geral`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl }
      });
      if (!error) {
        toast.success('Conta criada! Verifique seu email para confirmar.');
      }
      return { error };
    } catch (e: any) {
      toast.error('Erro ao criar conta. Tente novamente.');
      return { error: e };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
