import { useEffect } from "react";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMetaConnection } from "@/hooks/useMetaConnection";
import { toast } from "sonner";

export default function AdsNeuaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeCode } = useMetaConnection();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    if (error) {
      toast.error("Conexão com Meta cancelada.");
      navigate("/ads-neua");
      return;
    }
    if (code) {
      exchangeCode(code)
        .then(() => {
          toast.success("Conta Meta conectada com sucesso!");
          navigate("/ads-neua");
        })
        .catch(err => {
          toast.error(`Erro ao conectar: ${err.message}`);
          navigate("/ads-neua");
        });
    } else {
      navigate("/ads-neua");
    }
  }, [searchParams, exchangeCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Conectando com a Meta...</p>
      </div>
    </div>
  );
}
