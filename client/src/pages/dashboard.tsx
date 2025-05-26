import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import MetricsGrid from "@/components/metrics-grid";
import ConnectionsCard from "@/components/connections-card";
import ActivityFeed from "@/components/activity-feed";
import QuickActions from "@/components/quick-actions";
import PerformanceChart from "@/components/performance-chart";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader user={user} />
      
      <div className="flex">
        <DashboardSidebar />
        
        <main className="flex-1 lg:pl-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Dashboard Principal</h1>
                    <p className="mt-1 text-sm text-neutral-600">Visão geral do seu negócio digital</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exportar Dados
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nova Automação
                    </button>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <MetricsGrid />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Connections Card */}
                <div className="lg:col-span-2">
                  <ConnectionsCard />
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                  <ActivityFeed />
                  <QuickActions />
                </div>
              </div>

              {/* Performance Chart */}
              <div className="mt-8">
                <PerformanceChart />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
