import { 
  users, 
  vulnerabilities,
  securityScans,
  remediationTasks,
  type User, 
  type InsertUser,
  type Vulnerability,
  type InsertVulnerability,
  type SecurityScan,
  type InsertSecurityScan,
  type RemediationTask,
  type InsertRemediationTask
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vulnerability operations
  getVulnerabilities(): Promise<Vulnerability[]>;
  getVulnerabilityById(id: number): Promise<Vulnerability | undefined>;
  createVulnerability(vulnerability: InsertVulnerability): Promise<Vulnerability>;
  updateVulnerabilityStatus(id: number, status: string): Promise<Vulnerability | undefined>;

  // Security scan operations
  getLatestSecurityScan(): Promise<SecurityScan | undefined>;
  createSecurityScan(scan: InsertSecurityScan): Promise<SecurityScan>;
  updateSecurityScan(id: number, updates: Partial<SecurityScan>): Promise<SecurityScan | undefined>;

  // Remediation task operations
  getRemediationTasks(): Promise<RemediationTask[]>;
  createRemediationTask(task: InsertRemediationTask): Promise<RemediationTask>;
  updateRemediationTaskStatus(id: number, status: string): Promise<RemediationTask | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vulnerabilities: Map<number, Vulnerability>;
  private securityScans: Map<number, SecurityScan>;
  private remediationTasks: Map<number, RemediationTask>;
  private currentUserId: number;
  private currentVulnerabilityId: number;
  private currentScanId: number;
  private currentTaskId: number;

  constructor() {
    this.users = new Map();
    this.vulnerabilities = new Map();
    this.securityScans = new Map();
    this.remediationTasks = new Map();
    this.currentUserId = 1;
    this.currentVulnerabilityId = 1;
    this.currentScanId = 1;
    this.currentTaskId = 1;

    // Initialize with current vulnerabilities from the report
    this.initializeVulnerabilities();
  }

  private initializeVulnerabilities() {
    // Hard-coded secrets vulnerabilities
    this.createVulnerability({
      type: "hard-coded-secrets",
      severity: "critical",
      file: "server/setup-api.ts",
      line: 36,
      description: "Google Service Account private key detected in source code",
      recommendation: "Move private key to GOOGLE_SERVICE_ACCOUNT environment variable",
      status: "open"
    });

    this.createVulnerability({
      type: "hard-coded-secrets", 
      severity: "critical",
      file: "server/google-test.ts",
      line: 68,
      description: "Private key ID detected in source code",
      recommendation: "Move private key ID to environment variables",
      status: "open"
    });

    // Deprecated encryption functions
    this.createVulnerability({
      type: "deprecated-crypto",
      severity: "high", 
      file: "server/encryption.ts",
      line: 56,
      description: "Deprecated createCipher function generates same IV every time",
      recommendation: "Replace with createCipheriv using random IV",
      status: "open"
    });

    this.createVulnerability({
      type: "deprecated-crypto",
      severity: "high",
      file: "server/encryption.ts", 
      line: 60,
      description: "Deprecated createDecipher function used",
      recommendation: "Replace with createDecipheriv",
      status: "open"
    });

    // OAuth credentials
    this.createVulnerability({
      type: "oauth-exposure",
      severity: "medium",
      file: "server/oauth.ts",
      line: 28,
      description: "Google OAuth client ID exposed in source code",
      recommendation: "Move to GOOGLE_CLIENT_ID environment variable",
      status: "open"
    });

    // Initialize remediation tasks
    this.createRemediationTask({
      vulnerabilityId: 1,
      title: "Move hardcoded private keys to environment variables",
      description: "12 private keys detected in source code across multiple files",
      priority: "critical",
      category: "secrets-management", 
      affectedFiles: ["server/setup-api.ts", "server/google-test.ts", "attached_assets/"],
      autoFixAvailable: true,
      status: "pending"
    });

    this.createRemediationTask({
      vulnerabilityId: 3,
      title: "Update deprecated encryption functions",
      description: "Replace createCipher/createDecipher with createCipheriv/createDecipheriv",
      priority: "high",
      category: "cryptography",
      affectedFiles: ["server/encryption.ts"],
      autoFixAvailable: true,
      status: "pending"
    });

    this.createRemediationTask({
      vulnerabilityId: 5,
      title: "Secure OAuth credentials", 
      description: "Google and Facebook OAuth tokens found in source code",
      priority: "medium",
      category: "oauth-security",
      affectedFiles: ["server/oauth.ts"],
      autoFixAvailable: true,
      status: "pending"
    });

    this.createRemediationTask({
      title: "Clean up sensitive files in assets",
      description: "Remove log files and temporary files containing credentials",
      priority: "low",
      category: "file-cleanup",
      affectedFiles: ["attached_assets/"],
      autoFixAvailable: true,
      status: "pending"
    });

    // Initialize latest security scan
    this.createSecurityScan({
      repository: "Vgactec/qmark",
      branch: "main",
      totalVulnerabilities: 55,
      criticalCount: 12,
      highCount: 18,
      mediumCount: 21,
      lowCount: 4,
      status: "completed",
      metadata: {
        lastScanTime: "May 26, 2025 at 8:04 PM",
        scanDuration: "2.3 minutes"
      }
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getVulnerabilities(): Promise<Vulnerability[]> {
    return Array.from(this.vulnerabilities.values());
  }

  async getVulnerabilityById(id: number): Promise<Vulnerability | undefined> {
    return this.vulnerabilities.get(id);
  }

  async createVulnerability(vulnerability: InsertVulnerability): Promise<Vulnerability> {
    const id = this.currentVulnerabilityId++;
    const newVuln: Vulnerability = {
      ...vulnerability,
      id,
      detectedAt: new Date(),
      fixedAt: null
    };
    this.vulnerabilities.set(id, newVuln);
    return newVuln;
  }

  async updateVulnerabilityStatus(id: number, status: string): Promise<Vulnerability | undefined> {
    const vulnerability = this.vulnerabilities.get(id);
    if (vulnerability) {
      const updated = {
        ...vulnerability,
        status,
        fixedAt: status === "fixed" ? new Date() : vulnerability.fixedAt
      };
      this.vulnerabilities.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getLatestSecurityScan(): Promise<SecurityScan | undefined> {
    const scans = Array.from(this.securityScans.values());
    return scans.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
  }

  async createSecurityScan(scan: InsertSecurityScan): Promise<SecurityScan> {
    const id = this.currentScanId++;
    const newScan: SecurityScan = {
      ...scan,
      id,
      startedAt: new Date(),
      completedAt: null
    };
    this.securityScans.set(id, newScan);
    return newScan;
  }

  async updateSecurityScan(id: number, updates: Partial<SecurityScan>): Promise<SecurityScan | undefined> {
    const scan = this.securityScans.get(id);
    if (scan) {
      const updated = { ...scan, ...updates };
      this.securityScans.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getRemediationTasks(): Promise<RemediationTask[]> {
    return Array.from(this.remediationTasks.values());
  }

  async createRemediationTask(task: InsertRemediationTask): Promise<RemediationTask> {
    const id = this.currentTaskId++;
    const newTask: RemediationTask = {
      ...task,
      id,
      createdAt: new Date(),
      completedAt: null
    };
    this.remediationTasks.set(id, newTask);
    return newTask;
  }

  async updateRemediationTaskStatus(id: number, status: string): Promise<RemediationTask | undefined> {
    const task = this.remediationTasks.get(id);
    if (task) {
      const updated = {
        ...task,
        status,
        completedAt: status === "completed" ? new Date() : task.completedAt
      };
      this.remediationTasks.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
