import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Grid,
  Zap,
  Link2,
  Users,
  TrendingUp,
  BarChart2,
  Settings,
  HelpCircle,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", name: "Dashboard", icon: Grid, active: true },
  { id: "automations", name: "Automações", icon: Zap },
  { id: "connections", name: "Conexões OAuth2", icon: Link2 },
  { id: "leads", name: "Clientes & Leads", icon: Users },
  { id: "campaigns", name: "Campanhas", icon: TrendingUp },
  { id: "reports", name: "Relatórios", icon: BarChart2 },
  { id: "settings", name: "Configurações", icon: Settings },
];

export default function DashboardSidebar() {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-white border-r border-neutral-200">
      <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4 overflow-y-auto">
        <div className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
                onClick={() => setActiveItem(item.id)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            );
          })}
        </div>
        
        {/* Support Section */}
        <div className="px-3 mt-6">
          <Card className="bg-neutral-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-neutral-900">Precisa de Ajuda?</h3>
                  <p className="text-xs text-neutral-600 mt-1">Acesse nossa central de suporte</p>
                  <Button 
                    variant="link" 
                    className="mt-2 p-0 h-auto text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Ver Tutoriais
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}
