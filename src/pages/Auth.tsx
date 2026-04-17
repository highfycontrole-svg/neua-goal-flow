import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';

const authSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLoading) {
      timer = setTimeout(() => setSlowConnection(true), 2000);
    } else {
      setSlowConnection(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = authSchema.parse({ email, password });
      if (isLogin) {
        await signIn(validatedData.email, validatedData.password);
      } else {
        await signUp(validatedData.email, validatedData.password);
      }
      // Toasts de erro/sucesso já são disparados dentro de signIn/signUp
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card-neua-elevated p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Neua Logo" className="h-14 w-auto" />
              <div>
                <h1 className="text-3xl font-display font-bold">Neua</h1>
                <p className="text-sm text-muted-foreground">
                  Seu Ambiente. <span className="font-bold">Sua Assinatura</span>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-semibold mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? 'Entre para acessar suas metas' : 'Comece a gerenciar suas metas'}
            </p>
          </div>

          <div className="card-neua p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta')}
              </Button>

              {slowConnection && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Conectando ao servidor... Isso pode levar alguns segundos.
                </p>
              )}
            </form>
          </div>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Gerencie suas metas com clareza e eficiência</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
