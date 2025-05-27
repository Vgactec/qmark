import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Extract query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const connected = urlParams.get("connected");

    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      setLocation("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  const connected = urlParams.get("connected");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center">
            {error ? (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-neutral-900 mb-2">
                  Erro na Conexão
                </h1>
                <p className="text-sm text-neutral-600 mb-4">
                  Não foi possível conectar com a plataforma. Tente novamente.
                </p>
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </p>
              </>
            ) : connected ? (
              <>
                <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h1 className="text-xl font-bold text-neutral-900 mb-2">
                  Conexão Realizada!
                </h1>
                <p className="text-sm text-neutral-600 mb-4">
                  Sua conta foi conectada com sucesso. Redirecionando para o dashboard...
                </p>
                <p className="text-xs text-secondary font-medium">
                  Plataforma: {connected}
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                <h1 className="text-xl font-bold text-neutral-900 mb-2">
                  Processando Conexão
                </h1>
                <p className="text-sm text-neutral-600">
                  Aguarde enquanto processamos sua conexão OAuth2...
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
