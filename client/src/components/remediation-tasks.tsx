import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, Shield, Globe, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RemediationTasksProps {
  tasks: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function RemediationTasks({ tasks, isLoading, onRefresh }: RemediationTasksProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const autoFixMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/remediation-tasks/${taskId}/auto-fix`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Auto-fix successful",
        description: "The security issue has been automatically resolved."
      });
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ["/api/vulnerabilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/security/scan"] });
    },
    onError: () => {
      toast({
        title: "Auto-fix failed",
        description: "Unable to automatically fix this issue. Manual intervention required.",
        variant: "destructive"
      });
    }
  });

  const getTaskIcon = (category: string) => {
    switch (category) {
      case "secrets-management": return Key;
      case "cryptography": return Shield;
      case "oauth-security": return Globe;
      case "file-cleanup": return Trash2;
      default: return Shield;
    }
  };

  const getSeverityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-600";
      case "high": return "bg-orange-600";
      case "medium": return "bg-yellow-600";
      case "low": return "bg-green-600";
      default: return "bg-gray-600";
    }
  };

  const getSeverityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Security Remediation Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Loading remediation tasks...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Security Remediation Tasks</CardTitle>
        <p className="text-sm text-gray-600">Follow these steps to secure your repository</p>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-gray-200">
          {tasks.map((task) => {
            const IconComponent = getTaskIcon(task.category);
            const isCompleted = task.status === "completed";
            const isFixing = autoFixMutation.isPending;
            
            return (
              <div key={task.id} className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg px-4 -mx-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 ${getSeverityColor(task.priority)} rounded-full flex items-center justify-center`}>
                      <IconComponent className="text-white text-sm" size={16} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={getSeverityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.affectedFiles && task.affectedFiles.length > 0 && (
                        <span className="text-xs text-gray-500">
                          Affects: {task.affectedFiles.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {task.autoFixAvailable && !isCompleted && (
                    <Button 
                      size="sm"
                      onClick={() => autoFixMutation.mutate(task.id)}
                      disabled={isFixing}
                      className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {isFixing ? "Fixing..." : isCompleted ? "Fixed" : "Auto-Fix"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
