import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Mail, MessageCircle, Send } from "lucide-react";

interface OAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const platforms: Platform[] = [
  {
    id: "facebook",
    name: "Facebook & Instagram",
    icon: <Facebook className="h-5 w-5" />,
    color: "text-blue-600",
    description: "Conecte suas páginas do Facebook e perfis do Instagram",
  },
  {
    id: "google",
    name: "Gmail & Google Ads",
    icon: <Mail className="h-5 w-5" />,
    color: "text-red-600",
    description: "Acesse emails e gerencie campanhas do Google Ads",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: <MessageCircle className="h-5 w-5" />,
    color: "text-green-600",
    description: "Automatize mensagens e gerencie conversas",
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    icon: <Send className="h-5 w-5" />,
    color: "text-blue-500",
    description: "Configure bot para captura de leads",
  },
];

export default function OAuthModal({ open, onOpenChange }: OAuthModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = async (platformId: string) => {
    try {
      setConnecting(platformId);
      
      const response = await fetch(`/api/oauth/initiate/${platformId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to initiate OAuth flow");
      }
      
      const { authUrl } = await response.json();
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error("OAuth initiation error:", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível iniciar o processo de conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar Nova Plataforma</DialogTitle>
          <DialogDescription>
            Escolha uma plataforma para conectar via OAuth2 seguro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {platforms.map((platform) => (
            <Button
              key={platform.id}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleConnect(platform.id)}
              disabled={connecting === platform.id}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`flex-shrink-0 ${platform.color}`}>
                  {platform.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-neutral-900">
                    {platform.name}
                  </div>
                  <div className="text-xs text-neutral-600 mt-1">
                    {platform.description}
                  </div>
                </div>
                {connecting === platform.id && (
                  <div className="flex-shrink-0">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-600 text-center">
            Suas credenciais são armazenadas com criptografia AES256 em conformidade com a LGPD
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
