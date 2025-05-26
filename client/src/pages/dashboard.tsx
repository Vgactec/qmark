import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Github, Bell, Shield, Cog, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VulnerabilityBreakdown from "@/components/vulnerability-breakdown";
import RemediationTasks from "@/components/remediation-tasks";
import ServerStatus from "@/components/server-status";
import { apiRequest } from "@/lib/queryClient";

export default function SecurityDashboard() {
  const { data: securityScan, isLoading: scanLoading, refetch: refetchScan } = useQuery({
    queryKey: ["/api/security/scan"],
  });

  const { data: remediationTasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ["/api/remediation-tasks"],
  });

  const { data: vulnerabilities, refetch: refetchVulnerabilities } = useQuery({
    queryKey: ["/api/vulnerabilities"],
  });

  const handleRescan = async () => {
    try {
      await apiRequest("POST", "/api/security/scan");
      refetchScan();
      refetchVulnerabilities();
      refetchTasks();
    } catch (error) {
      console.error("Rescan failed:", error);
    }
  };

  const handleAutoRemediation = async () => {
    // Auto-fix all available tasks
    if (remediationTasks) {
      for (const task of remediationTasks) {
        if (task.autoFixAvailable && task.status === "pending") {
          try {
            await apiRequest("POST", `/api/remediation-tasks/${task.id}/auto-fix`);
          } catch (error) {
            console.error(`Auto-fix failed for task ${task.id}:`, error);
          }
        }
      }
      refetchTasks();
      refetchVulnerabilities();
      refetchScan();
    }
  };

  if (scanLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Github className="text-2xl text-gray-900" />
                <h1 className="text-xl font-semibold text-gray-900">Security Scanner</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Button variant="ghost" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  Scanner
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  Repository
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  Settings
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="text-lg" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                    3
                  </Badge>
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">Alex Developer</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Alert Banner */}
        {securityScan && securityScan.criticalCount > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="text-red-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Critical Security Issues Detected</h3>
                <p className="text-sm text-red-700 mt-1">
                  {securityScan.totalVulnerabilities} vulnerabilities found including exposed private keys and deprecated encryption methods. Immediate action required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Repository Info */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Github className="text-2xl text-gray-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {securityScan?.repository || "Vgactec/qmark"}
                      </h2>
                      <p className="text-gray-600">
                        Last scanned: {securityScan?.metadata?.lastScanTime || "May 26, 2025 at 8:04 PM"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={handleRescan}>
                    <Shield className="mr-2 h-4 w-4" />
                    Rescan Repository
                  </Button>
                  <Button onClick={handleAutoRemediation}>
                    <Cog className="mr-2 h-4 w-4" />
                    Auto-Fix Issues
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {securityScan?.totalVulnerabilities || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Vulnerabilities</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {securityScan?.criticalCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Critical Issues</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {securityScan?.highCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {(securityScan?.mediumCount || 0) + (securityScan?.lowCount || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Medium/Low</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Remediation Tasks */}
        <RemediationTasks 
          tasks={remediationTasks || []} 
          isLoading={tasksLoading}
          onRefresh={refetchTasks}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vulnerability Breakdown */}
          <VulnerabilityBreakdown 
            vulnerabilities={vulnerabilities || []}
            securityScan={securityScan}
          />

          {/* Server Status */}
          <ServerStatus />
        </div>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Secure Your Repository?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Run the automated security fixes or configure manual remediation steps
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Cog className="mr-2 h-4 w-4" />
                  Configure Environment
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleAutoRemediation}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Auto-Remediation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600">© 2025 Security Scanner. Built for developers.</span>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Documentation</a>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Support</a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Powered by:</span>
              <Github className="text-gray-600" />
              <Shield className="text-gray-600" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
