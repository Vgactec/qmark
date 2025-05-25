import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { initiateOAuth, handleOAuthCallback } from "./oauth";
import { z } from "zod";
import { insertLeadSchema, insertAutomationSchema, insertActivitySchema } from "@shared/schema";
import { testGoogleCloud } from "./google-test"; // Import testGoogleCloud

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // OAuth routes
  app.get("/api/oauth/initiate/:platform", isAuthenticated, initiateOAuth);
  app.get("/api/oauth/callback", handleOAuthCallback);

  app.get("/api/oauth/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getOauthConnections(userId);

      // Remove sensitive data before sending to client
      const sanitizedConnections = connections.map(conn => ({
        ...conn,
        accessToken: undefined,
        refreshToken: undefined,
      }));

      res.json(sanitizedConnections);
    } catch (error) {
      console.error("Error fetching OAuth connections:", error);
      res.status(500).json({ message: "Failed to fetch OAuth connections" });
    }
  });

  app.delete("/api/oauth/connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectionId = parseInt(req.params.id);

      // Verify connection belongs to user
      const connection = await storage.getOauthConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ message: "Connection not found" });
      }

      await storage.deleteOauthConnection(connectionId);

      // Log activity
      await storage.createActivity({
        userId,
        type: "oauth_disconnected",
        title: "Conexão OAuth2 removida",
        description: `Desconectado de ${connection.platform}`,
        metadata: { platform: connection.platform },
      });

      res.json({ message: "Connection deleted successfully" });
    } catch (error) {
      console.error("Error deleting OAuth connection:", error);
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // Leads routes
  app.get("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const leads = await storage.getLeads(userId, limit);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leadData = insertLeadSchema.parse({ ...req.body, userId });

      const lead = await storage.createLead(leadData);

      // Log activity
      await storage.createActivity({
        userId,
        type: "lead_captured",
        title: "Novo lead capturado",
        description: `Lead ${lead.name || lead.email} foi adicionado`,
        metadata: { leadId: lead.id, source: lead.source },
      });

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Automations routes
  app.get("/api/automations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automations = await storage.getAutomations(userId);
      res.json(automations);
    } catch (error) {
      console.error("Error fetching automations:", error);
      res.status(500).json({ message: "Failed to fetch automations" });
    }
  });

  app.post("/api/automations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automationData = insertAutomationSchema.parse({ ...req.body, userId });

      const automation = await storage.createAutomation(automationData);

      // Log activity
      await storage.createActivity({
        userId,
        type: "automation_created",
        title: "Nova automação criada",
        description: `Automação "${automation.name}" foi criada`,
        metadata: { automationId: automation.id, type: automation.type },
      });

      res.status(201).json(automation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid automation data", errors: error.errors });
      }
      console.error("Error creating automation:", error);
      res.status(500).json({ message: "Failed to create automation" });
    }
  });

  app.patch("/api/automations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automationId = parseInt(req.params.id);

      // Verify automation belongs to user
      const automation = await storage.getAutomations(userId);
      const targetAutomation = automation.find(a => a.id === automationId);
      if (!targetAutomation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      const updates = req.body;
      const updatedAutomation = await storage.updateAutomation(automationId, updates);

      if (updatedAutomation) {
        // Log activity
        await storage.createActivity({
          userId,
          type: "automation_updated",
          title: "Automação atualizada",
          description: `Automação "${updatedAutomation.name}" foi atualizada`,
          metadata: { automationId: updatedAutomation.id },
        });
      }

      res.json(updatedAutomation);
    } catch (error) {
      console.error("Error updating automation:", error);
      res.status(500).json({ message: "Failed to update automation" });
    }
  });

  // Metrics routes
  // Test Google API Connection
  app.get("/api/test/google", async (req, res) => {
    const result = await testGoogleCloud();
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  });

  app.get("/api/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const metrics = await storage.getMetrics(userId, fromDate);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}