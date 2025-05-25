import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Link2, BarChart2, ChevronRight } from "lucide-react";
import { useState } from "react";
import OAuthModal from "./oauth-modal";

export default function QuickActions() {
  const [oauthModalOpen, setOauthModalOpen] = useState(false);

  const actions = [
    {
      id: 'test-google',
      title: 'Tester Google Cloud',
      description: 'Valider la connexion avec Google Cloud',
      icon: CloudCheck,
      action: async () => {
        try {
          const response = await fetch('/api/test/google');
          const data = await response.json();
          if (data.success) {
            toast({
              title: "Connexion réussie",
              description: `Project ID: ${data.projectId}`,
            });
          } else {
            throw new Error(data.error);
          }
        } catch (error) {
          toast({
            title: "Erreur de connexion",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    },
    {
      id: "workflow",
      title: "Novo Workflow",
      description: "Crie um novo workflow de gestão",
      icon: PlusCircle,
      action: () => {
        // TODO: Open workflow creation modal/page
        alert("Redirecionando para criador de workflows...\n\nEm produção, isso abriria o workflow builder.");
      },
    },
    {
      id: "connection",
      title: "Conectar Plataforma",
      description: "Adicione uma nova integração OAuth2",
      icon: Link2,
      action: () => setOauthModalOpen(true),
    },
    {
      id: "reports",
      title: "Ver Relatórios",
      description: "Acesse analytics detalhados",
      icon: BarChart2,
      action: () => {
        // TODO: Navigate to reports page
        alert("Abrindo relatórios detalhados...\n\nEm produção, isso mostraria analytics completos.");
      },
    },
  ];

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="border-b border-neutral-200">
          <CardTitle className="text-lg font-medium text-neutral-900">
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="w-full justify-between p-3 h-auto hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={action.action}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-neutral-900">
                        {action.title}
                      </div>
                      <div className="text-xs text-neutral-600">
                        {action.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <OAuthModal 
        open={oauthModalOpen} 
        onOpenChange={setOauthModalOpen} 
      />
    </>
  );
}
