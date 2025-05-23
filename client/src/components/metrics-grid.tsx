import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Zap, DollarSign } from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  totalConversions: number;
  activeWorkflows: number;
  totalRevenue: string;
}

export default function MetricsGrid() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-red-200">
            <CardContent className="p-5">
              <div className="text-center text-red-600">
                <p className="text-sm">Erro ao carregar métricas</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Leads Capturados",
      value: stats?.totalLeads || 0,
      icon: Users,
      change: "+12% este mês",
      changeType: "positive" as const,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Conversões",
      value: stats?.totalConversions || 0,
      icon: TrendingUp,
      change: "+8% este mês",
      changeType: "positive" as const,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Workflows Ativos",
      value: stats?.activeWorkflows || 0,
      icon: Zap,
      change: "5 executados hoje",
      changeType: "neutral" as const,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${stats?.totalRevenue || "0.00"}`,
      icon: DollarSign,
      change: "+15% este mês",
      changeType: "positive" as const,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="overflow-hidden shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-neutral-500 truncate">
                      {metric.title}
                    </dt>
                    <dd className="text-2xl font-bold text-neutral-900">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        metric.value
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center">
                  <div className={`flex items-center text-sm ${
                    metric.changeType === "positive" ? "text-secondary" : "text-neutral-600"
                  }`}>
                    {metric.changeType === "positive" && (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    )}
                    <span>{metric.change}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
