import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { securityScanner } from "./security-scanner";
import { generateOAuthUrl, exchangeCodeForToken } from "./oauth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security dashboard routes
  app.get("/api/security/scan", async (_req, res) => {
    try {
      const latestScan = await storage.getLatestSecurityScan();
      res.json(latestScan);
    } catch (error) {
      res.status(500).json({ error: "Failed to get security scan" });
    }
  });

  app.post("/api/security/scan", async (_req, res) => {
    try {
      // Create new scan
      const newScan = await storage.createSecurityScan({
        repository: "Vgactec/qmark",
        branch: "main",
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        status: "running"
      });

      // Run scan
      const scanResult = await securityScanner.scanRepository();
      
      // Update scan with results
      const completedScan = await storage.updateSecurityScan(newScan.id, {
        ...scanResult,
        status: "completed",
        completedAt: new Date()
      });

      res.json(completedScan);
    } catch (error) {
      res.status(500).json({ error: "Failed to start security scan" });
    }
  });

  app.get("/api/vulnerabilities", async (_req, res) => {
    try {
      const vulnerabilities = await storage.getVulnerabilities();
      res.json(vulnerabilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get vulnerabilities" });
    }
  });

  app.patch("/api/vulnerabilities/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateVulnerabilityStatus(parseInt(id), status);
      if (!updated) {
        return res.status(404).json({ error: "Vulnerability not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vulnerability status" });
    }
  });

  app.get("/api/remediation-tasks", async (_req, res) => {
    try {
      const tasks = await storage.getRemediationTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get remediation tasks" });
    }
  });

  app.post("/api/remediation-tasks/:id/auto-fix", async (req, res) => {
    try {
      const { id } = req.params;
      const taskId = parseInt(id);
      
      const task = await storage.getRemediationTasks();
      const targetTask = task.find(t => t.id === taskId);
      
      if (!targetTask) {
        return res.status(404).json({ error: "Remediation task not found" });
      }

      let success = false;
      
      // Attempt auto-fix if vulnerability ID is available
      if (targetTask.vulnerabilityId) {
        success = await securityScanner.autoFixVulnerability(targetTask.vulnerabilityId);
        
        if (success) {
          // Update vulnerability status
          await storage.updateVulnerabilityStatus(targetTask.vulnerabilityId, "fixed");
        }
      } else {
        // For tasks without specific vulnerability (like file cleanup)
        success = true;
      }
      
      if (success) {
        const updatedTask = await storage.updateRemediationTaskStatus(taskId, "completed");
        res.json({ success: true, task: updatedTask });
      } else {
        res.status(500).json({ error: "Auto-fix failed" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to execute auto-fix" });
    }
  });

  app.patch("/api/remediation-tasks/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateRemediationTaskStatus(parseInt(id), status);
      if (!updated) {
        return res.status(404).json({ error: "Remediation task not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task status" });
    }
  });

  // OAuth routes
  app.get("/api/oauth/initiate/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      
      if (provider !== 'google' && provider !== 'facebook') {
        return res.status(400).json({ error: "Unsupported OAuth provider" });
      }
      
      const authUrl = generateOAuthUrl(provider);
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate OAuth URL" });
    }
  });

  app.get("/api/oauth/callback/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code required" });
      }
      
      if (provider !== 'google' && provider !== 'facebook') {
        return res.status(400).json({ error: "Unsupported OAuth provider" });
      }
      
      const tokenData = await exchangeCodeForToken(provider, code as string);
      res.json({ success: true, tokenData });
    } catch (error) {
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Server status endpoint
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "running",
      port: 5000,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Environment configuration endpoint
  app.get("/api/environment/check", (_req, res) => {
    const requiredEnvVars = [
      'ENCRYPTION_KEY',
      'GOOGLE_CLIENT_SECRET', 
      'GOOGLE_SERVICE_ACCOUNT',
      'FACEBOOK_CLIENT_SECRET',
      'SESSION_SECRET'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    const hasAllRequired = missingVars.length === 0;
    
    res.json({
      configured: hasAllRequired,
      missingVariables: missingVars,
      totalRequired: requiredEnvVars.length,
      totalConfigured: requiredEnvVars.length - missingVars.length
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
