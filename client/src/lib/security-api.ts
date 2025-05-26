import { apiRequest } from "./queryClient";

export interface SecurityScan {
  id: number;
  repository: string;
  branch: string;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  metadata?: any;
}

export interface Vulnerability {
  id: number;
  type: string;
  severity: string;
  file: string;
  line?: number;
  description: string;
  recommendation: string;
  status: string;
  detectedAt: string;
  fixedAt?: string;
}

export interface RemediationTask {
  id: number;
  vulnerabilityId?: number;
  title: string;
  description: string;
  priority: string;
  category: string;
  affectedFiles: string[];
  autoFixAvailable: boolean;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export const securityApi = {
  // Security scans
  async getLatestScan(): Promise<SecurityScan> {
    const response = await apiRequest("GET", "/api/security/scan");
    return response.json();
  },

  async startScan(): Promise<SecurityScan> {
    const response = await apiRequest("POST", "/api/security/scan");
    return response.json();
  },

  // Vulnerabilities
  async getVulnerabilities(): Promise<Vulnerability[]> {
    const response = await apiRequest("GET", "/api/vulnerabilities");
    return response.json();
  },

  async updateVulnerabilityStatus(id: number, status: string): Promise<Vulnerability> {
    const response = await apiRequest("PATCH", `/api/vulnerabilities/${id}/status`, { status });
    return response.json();
  },

  // Remediation tasks
  async getRemediationTasks(): Promise<RemediationTask[]> {
    const response = await apiRequest("GET", "/api/remediation-tasks");
    return response.json();
  },

  async autoFixTask(taskId: number): Promise<{ success: boolean; task: RemediationTask }> {
    const response = await apiRequest("POST", `/api/remediation-tasks/${taskId}/auto-fix`);
    return response.json();
  },

  async updateTaskStatus(id: number, status: string): Promise<RemediationTask> {
    const response = await apiRequest("PATCH", `/api/remediation-tasks/${id}/status`, { status });
    return response.json();
  },

  // OAuth
  async initiateOAuth(provider: "google" | "facebook"): Promise<{ authUrl: string }> {
    const response = await apiRequest("GET", `/api/oauth/initiate/${provider}`);
    return response.json();
  },

  // Server status
  async getServerStatus(): Promise<any> {
    const response = await apiRequest("GET", "/api/status");
    return response.json();
  },

  // Environment check
  async checkEnvironment(): Promise<any> {
    const response = await apiRequest("GET", "/api/environment/check");
    return response.json();
  }
};
