import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SecurityDashboardProps {
  onRefresh?: () => void;
}

export default function SecurityDashboard({ onRefresh }: SecurityDashboardProps) {
  const { data: securityScan, isLoading } = useQuery({
    queryKey: ["/api/security/scan"],
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-600";
      case "high": return "bg-orange-600";
      case "medium": return "bg-yellow-600";
      case "low": return "bg-green-600";
      default: return "bg-gray-600";
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading security data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!securityScan) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No security scan data available</p>
          <Button onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Initial Scan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalVulns = securityScan.totalVulnerabilities || 0;
  const criticalProgress = totalVulns > 0 ? (securityScan.criticalCount / totalVulns) * 100 : 0;
  const highProgress = totalVulns > 0 ? (securityScan.highCount / totalVulns) * 100 : 0;
  const mediumProgress = totalVulns > 0 ? (securityScan.mediumCount / totalVulns) * 100 : 0;
  const lowProgress = totalVulns > 0 ? (securityScan.lowCount / totalVulns) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Vulnerabilities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vulnerabilities</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${totalVulns > 0 ? 'text-red-600' : 'text-green-600'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVulns}</div>
          <Badge variant={totalVulns > 0 ? "destructive" : "secondary"} className="mt-2">
            {securityScan.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{securityScan.criticalCount}</div>
          <Progress value={criticalProgress} className="mt-2" />
          <p className="text-xs text-gray-600 mt-1">{criticalProgress.toFixed(1)}% of total</p>
        </CardContent>
      </Card>

      {/* High Priority */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{securityScan.highCount}</div>
          <Progress value={highProgress} className="mt-2" />
          <p className="text-xs text-gray-600 mt-1">{highProgress.toFixed(1)}% of total</p>
        </CardContent>
      </Card>

      {/* Medium/Low */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medium/Low</CardTitle>
          <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {securityScan.mediumCount + securityScan.lowCount}
          </div>
          <Progress value={mediumProgress + lowProgress} className="mt-2" />
          <p className="text-xs text-gray-600 mt-1">
            {(mediumProgress + lowProgress).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
