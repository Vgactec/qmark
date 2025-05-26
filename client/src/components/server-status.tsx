import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ServerStatus() {
  const { data: status } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const mockLogs = [
    "6:15:02 PM [express] GET /api/auth/user 200 in 152ms",
    "6:15:02 PM [express] GET /api/oauth/connections 304 in 143ms", 
    "6:15:02 PM [express] GET /api/metrics 200 in 145ms",
    "express deprecated req.host: Use req.hostname instead",
    "6:15:02 PM [express] GET /api/dashboard/activities 304 in 307ms",
    "6:15:02 PM [express] GET /api/dashboard/stats 304 in 463ms"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">Application Running</span>
          </div>
          <Badge variant="secondary">Port {status?.port || 5000}</Badge>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 max-h-48 overflow-y-auto mb-4">
          <div className="space-y-1">
            {mockLogs.map((log, index) => (
              <div key={index} className={log.includes("deprecated") ? "text-yellow-400" : ""}>
                {log}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <div className="text-xs text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {status?.uptime ? formatUptime(status.uptime) : "152ms"}
            </div>
            <div className="text-xs text-gray-600">
              {status?.uptime ? "Running Time" : "Avg Response"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
