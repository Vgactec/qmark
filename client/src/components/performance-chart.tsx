import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import type { Metric } from "@shared/schema";

type TimePeriod = "7d" | "30d" | "today";

export default function PerformanceChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30d");

  const fromDate = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const { data: metrics, isLoading, error } = useQuery<Metric[]>({
    queryKey: ["/api/metrics", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/metrics?from=${fromDate().toISOString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      return response.json();
    },
  });

  const periodLabels = {
    "30d": "30 dias",
    "7d": "7 dias", 
    "today": "Hoje",
  };

  const calculateTotals = () => {
    if (!metrics || metrics.length === 0) {
      return {
        totalLeads: 0,
        totalConversions: 0,
        totalRevenue: "0.00",
      };
    }

    const totals = metrics.reduce(
      (acc, metric) => ({
        totalLeads: acc.totalLeads + (metric.leadsCount || 0),
        totalConversions: acc.totalConversions + (metric.conversionsCount || 0),
        totalRevenue: acc.totalRevenue + parseFloat(metric.revenue || "0"),
      }),
      { totalLeads: 0, totalConversions: 0, totalRevenue: 0 }
    );

    return {
      ...totals,
      totalRevenue: totals.totalRevenue.toFixed(2),
    };
  };

  const totals = calculateTotals();

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-neutral-900">
              Performance das Campanhas
            </CardTitle>
            <p className="text-sm text-neutral-600">
              Últimos {periodLabels[selectedPeriod]}
            </p>
          </div>
          <div className="flex space-x-2">
            {(Object.keys(periodLabels) as TimePeriod[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={
                  selectedPeriod === period
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:text-primary"
                }
              >
                {periodLabels[period]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error ? (
          <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-2">Erro ao carregar dados</p>
              <p className="text-sm text-red-500">
                Não foi possível carregar as métricas de performance
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="h-8 w-8 rounded-full mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>
        ) : !metrics || metrics.length === 0 ? (
          <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-sm text-neutral-600 mb-2">Nenhum dado disponível</p>
              <p className="text-xs text-neutral-500">
                Os dados aparecerão aqui conforme você usar a plataforma
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">
                  {totals.totalLeads}
                </div>
                <div className="text-sm text-blue-700">Leads Capturados</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">
                  {totals.totalConversions}
                </div>
                <div className="text-sm text-green-700">Conversões</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-900">
                  R$ {totals.totalRevenue}
                </div>
                <div className="text-sm text-purple-700">Receita Total</div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-48 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-sm text-neutral-600 mb-2">Gráfico de Performance</p>
                <p className="text-xs text-neutral-500">
                  Visualização detalhada das métricas será implementada aqui
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
