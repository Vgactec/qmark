import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Mail, MessageCircle, Send, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import OAuthModal from "./oauth-modal";
import type { OauthConnection } from "@shared/schema";

const platformIcons = {
  facebook: Facebook,
  google: Mail,
  whatsapp: MessageCircle,
  telegram: Send,
};

const platformColors = {
  facebook: "text-blue-600",
  google: "text-red-600",
  whatsapp: "text-green-600",
  telegram: "text-blue-500",
};

const platformNames = {
  facebook: "Facebook & Instagram",
  google: "Gmail & Google Ads",
  whatsapp: "WhatsApp Business",
  telegram: "Telegram Bot",
};

export default function ConnectionsCard() {
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections, isLoading, error } = useQuery<OauthConnection[]>({
    queryKey: ["/api/oauth/connections"],
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await fetch(`/api/oauth/connections/${connectionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete connection");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oauth/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Conexão Removida",
        description: "A conexão foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a conexão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConnection = (connectionId: number) => {
    if (window.confirm("Tem certeza que deseja remover esta conexão?")) {
      deleteConnectionMutation.mutate(connectionId);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return "Nunca sincronizado";
    
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Há menos de 1 hora";
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-neutral-900">
                Conexões OAuth2
              </CardTitle>
              <p className="text-sm text-neutral-600">Status das suas integrações</p>
            </div>
            <Button 
              onClick={() => setOauthModalOpen(true)}
              size="sm"
            >
              Conectar Plataforma
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Erro ao carregar conexões</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/oauth/connections"] })}
              >
                Tentar Novamente
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : connections?.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Nenhuma conexão configurada
              </h3>
              <p className="text-neutral-600 mb-4">
                Conecte suas plataformas favoritas para começar a automatizar seu marketing.
              </p>
              <Button onClick={() => setOauthModalOpen(true)}>
                Conectar Primeira Plataforma
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections?.map((connection) => {
                const IconComponent = platformIcons[connection.platform as keyof typeof platformIcons];
                const platformColor = platformColors[connection.platform as keyof typeof platformColors];
                const platformName = platformNames[connection.platform as keyof typeof platformNames];
                
                return (
                  <div key={connection.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                        {IconComponent && (
                          <IconComponent className={`h-5 w-5 ${platformColor}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900">
                          {platformName || connection.platform}
                        </h4>
                        <p className="text-xs text-neutral-600">
                          Última sincronização: {formatLastSync(connection.lastSync)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={connection.isActive ? "secondary" : "outline"}
                        className={connection.isActive ? "bg-secondary/10 text-secondary" : ""}
                      >
                        {connection.isActive ? "Conectado" : "Inativo"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConnection(connection.id)}
                        disabled={deleteConnectionMutation.isPending}
                        className="text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <OAuthModal 
        open={oauthModalOpen} 
        onOpenChange={setOauthModalOpen} 
      />
    </>
  );
}
