import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, UserPlus, Share2, Link2, Settings } from "lucide-react";
import type { Activity } from "@shared/schema";

const activityIcons = {
  automation_run: Zap,
  lead_captured: UserPlus,
  post_published: Share2,
  oauth_connected: Link2,
  oauth_disconnected: Link2,
  automation_created: Zap,
  automation_updated: Settings,
};

const activityColors = {
  automation_run: "text-primary",
  lead_captured: "text-secondary",
  post_published: "text-blue-600",
  oauth_connected: "text-green-600",
  oauth_disconnected: "text-red-600",
  automation_created: "text-purple-600",
  automation_updated: "text-yellow-600",
};

export default function ActivityFeed() {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/activities"],
  });

  const formatTimeAgo = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "agora mesmo";
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-neutral-200">
        <CardTitle className="text-lg font-medium text-neutral-900">
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {error ? (
          <div className="text-center py-4">
            <p className="text-red-600 text-sm">Erro ao carregar atividades</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities?.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-neutral-600 text-sm">
              Nenhuma atividade recente
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities?.map((activity, index) => {
                const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || Zap;
                const iconColor = activityColors[activity.type as keyof typeof activityColors] || "text-neutral-600";
                const isLast = index === activities.length - 1;
                
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200" />
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className={`h-8 w-8 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200`}>
                            <IconComponent className={`h-4 w-4 ${iconColor}`} />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm">
                              <span className="font-medium text-neutral-900">
                                {activity.title}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="mt-0.5 text-xs text-neutral-600">
                                {activity.description}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-neutral-500">
                              {formatTimeAgo(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
