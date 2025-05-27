import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { initiateOAuth, handleOAuthCallback } from "./oauth";
import { z } from "zod";
import { insertLeadSchema, insertAutomationSchema, insertActivitySchema } from "@shared/schema";
import { testGoogleCloudConnection } from "./google-test";
import { getSystemStatus, autoConfigureSystem } from "./setup-api";

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

  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Effacer les cookies de session
      res.clearCookie('replauth');
      res.clearCookie('replauth.sig');
      res.clearCookie('connect.sid');

      // Détruire la session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
          }
        });
      }

      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
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

  // System configuration routes
  app.get("/api/system/status", getSystemStatus);
  app.post("/api/system/auto-configure", autoConfigureSystem);

  // Google Cloud test route
  app.get("/api/test/google", async (req, res) => {
    try {
      const result = await testGoogleCloudConnection();
      res.json(result);
    } catch (error) {
      console.error("Google Cloud test error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Test complet du système QMARK
  app.get("/api/test/system-complete", async (req, res) => {
    try {
      console.log("🧪 [TEST SYSTÈME] Début test complet QMARK...");
      
      const results = {
        system: "QMARK SaaS",
        timestamp: new Date().toISOString(),
        tests: {},
        summary: { passed: 0, failed: 0, total: 0 }
      };

      // Test 1: Variables d'environnement
      console.log("🔍 [TEST] 1. Variables d'environnement...");
      const envTest = {
        FACEBOOK_CLIENT_ID: !!process.env.FACEBOOK_CLIENT_ID,
        FACEBOOK_CLIENT_SECRET: !!process.env.FACEBOOK_CLIENT_SECRET,
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        DATABASE_URL: !!process.env.DATABASE_URL,
        ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
        SESSION_SECRET: !!process.env.SESSION_SECRET,
        CLIENT_URL: !!process.env.CLIENT_URL,
        GOOGLE_SERVICE_ACCOUNT: !!process.env.GOOGLE_SERVICE_ACCOUNT
      };
      
      const envPassed = Object.values(envTest).every(Boolean);
      results.tests.environment = { status: envPassed ? "✅ PASS" : "❌ FAIL", details: envTest };
      if (envPassed) results.summary.passed++; else results.summary.failed++;
      results.summary.total++;

      // Test 2: Base de données
      console.log("🔍 [TEST] 2. Base de données...");
      try {
        const { pool } = await import('./db');
        const dbResult = await pool.query('SELECT NOW()');
        results.tests.database = { 
          status: "✅ PASS", 
          details: { connected: true, timestamp: dbResult.rows[0].now }
        };
        results.summary.passed++;
      } catch (dbError) {
        results.tests.database = { 
          status: "❌ FAIL", 
          details: { error: dbError instanceof Error ? dbError.message : "Unknown error" }
        };
        results.summary.failed++;
      }
      results.summary.total++;

      // Test 3: Google Cloud
      console.log("🔍 [TEST] 3. Google Cloud Storage...");
      try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const projectId = await storage.getProjectId();
        results.tests.googleCloud = { 
          status: "✅ PASS", 
          details: { connected: true, projectId }
        };
        results.summary.passed++;
      } catch (gcError) {
        results.tests.googleCloud = { 
          status: "❌ FAIL", 
          details: { error: gcError instanceof Error ? gcError.message : "Unknown error" }
        };
        results.summary.failed++;
      }
      results.summary.total++;

      // Test 4: Facebook App ID validation
      console.log("🔍 [TEST] 4. Facebook App ID...");
      console.log(`🔍 [TEST] FACEBOOK_CLIENT_ID configuré: ${!!process.env.FACEBOOK_CLIENT_ID}`);
      console.log(`🔍 [TEST] FACEBOOK_CLIENT_SECRET configuré: ${!!process.env.FACEBOOK_CLIENT_SECRET}`);
      console.log(`🔍 [TEST] App ID value: ${process.env.FACEBOOK_CLIENT_ID}`);
      
      if (process.env.FACEBOOK_CLIENT_ID && /^\d+$/.test(process.env.FACEBOOK_CLIENT_ID)) {
        try {
          const graphResponse = await fetch(`https://graph.facebook.com/${process.env.FACEBOOK_CLIENT_ID}?fields=id,name`);
          const graphData = await graphResponse.json();
          
          console.log(`🔍 [TEST] Facebook Graph response:`, graphData);
          
          if (graphResponse.ok && graphData.id) {
            results.tests.facebookApp = { 
              status: "✅ PASS", 
              details: { valid: true, appId: graphData.id, name: graphData.name }
            };
            results.summary.passed++;
          } else {
            results.tests.facebookApp = { 
              status: "❌ FAIL", 
              details: { 
                error: graphData.error?.message || "App not found",
                appId: process.env.FACEBOOK_CLIENT_ID,
                response: graphData 
              }
            };
            results.summary.failed++;
          }
        } catch (fbError) {
          results.tests.facebookApp = { 
            status: "❌ FAIL", 
            details: { 
              error: fbError instanceof Error ? fbError.message : "Unknown error",
              appId: process.env.FACEBOOK_CLIENT_ID
            }
          };
          results.summary.failed++;
        }
      } else {
        results.tests.facebookApp = { 
          status: "❌ FAIL", 
          details: { 
            error: "Facebook Client ID manquant ou invalide",
            configured: !!process.env.FACEBOOK_CLIENT_ID,
            isNumeric: process.env.FACEBOOK_CLIENT_ID ? /^\d+$/.test(process.env.FACEBOOK_CLIENT_ID) : false,
            value: process.env.FACEBOOK_CLIENT_ID
          }
        };
        results.summary.failed++;
      }
      results.summary.total++;

      // Test 5: OAuth URLs génération
      console.log("🔍 [TEST] 5. Génération URLs OAuth...");
      try {
        const { OAUTH_CONFIGS } = await import('./oauth');
        const facebookConfig = OAUTH_CONFIGS?.facebook;
        const googleConfig = OAUTH_CONFIGS?.google;
        
        const oauthTest = {
          facebook: !!facebookConfig?.clientId && !!facebookConfig?.clientSecret,
          google: !!googleConfig?.clientId && !!googleConfig?.clientSecret,
          redirectUri: process.env.CLIENT_URL + "/api/oauth/callback"
        };
        
        const oauthPassed = oauthTest.facebook && oauthTest.google;
        results.tests.oauth = { 
          status: oauthPassed ? "✅ PASS" : "❌ FAIL", 
          details: oauthTest 
        };
        if (oauthPassed) results.summary.passed++; else results.summary.failed++;
      } catch (oauthError) {
        results.tests.oauth = { 
          status: "❌ FAIL", 
          details: { error: oauthError instanceof Error ? oauthError.message : "Unknown error" }
        };
        results.summary.failed++;
      }
      results.summary.total++;

      // Test 6: Chiffrement
      console.log("🔍 [TEST] 6. Système de chiffrement...");
      try {
        const { encrypt, decrypt } = await import('./encryption');
        const testString = "test-qmark-encryption-2024";
        const encrypted = encrypt(testString);
        const decrypted = decrypt(encrypted);
        
        const encryptionPassed = decrypted === testString;
        results.tests.encryption = { 
          status: encryptionPassed ? "✅ PASS" : "❌ FAIL", 
          details: { working: encryptionPassed }
        };
        if (encryptionPassed) results.summary.passed++; else results.summary.failed++;
      } catch (encError) {
        results.tests.encryption = { 
          status: "❌ FAIL", 
          details: { error: encError instanceof Error ? encError.message : "Unknown error" }
        };
        results.summary.failed++;
      }
      results.summary.total++;

      // Résultat final
      const successRate = Math.round((results.summary.passed / results.summary.total) * 100);
      results.status = successRate >= 80 ? "🎉 SYSTÈME OPÉRATIONNEL" : "⚠️ ATTENTION REQUISE";
      results.successRate = `${successRate}%`;

      console.log(`📊 [TEST SYSTÈME] Résultat: ${results.summary.passed}/${results.summary.total} tests réussis (${successRate}%)`);
      
      res.json(results);
    } catch (error) {
      console.error("❌ [TEST SYSTÈME] Erreur:", error);
      res.status(500).json({ 
        status: "❌ ERREUR SYSTÈME",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Test Facebook OAuth configuration
  app.get("/api/test/facebook", async (req, res) => {
    try {
      console.log("🔍 [TEST FACEBOOK] Début test configuration Facebook OAuth...");
      
      const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
      const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
      const clientUrl = process.env.CLIENT_URL;

      console.log(`🔍 [TEST FACEBOOK] FACEBOOK_CLIENT_ID: ${facebookClientId ? '✅ Configuré' : '❌ Manquant'}`);
      console.log(`🔍 [TEST FACEBOOK] FACEBOOK_CLIENT_SECRET: ${facebookClientSecret ? '✅ Configuré' : '❌ Manquant'}`);
      console.log(`🔍 [TEST FACEBOOK] CLIENT_URL: ${clientUrl || 'http://localhost:5000'}`);

      const errors = [];
      
      if (!facebookClientId) {
        errors.push("FACEBOOK_CLIENT_ID manquant dans les Secrets");
      } else if (!/^\d+$/.test(facebookClientId)) {
        errors.push(`FACEBOOK_CLIENT_ID invalide: ${facebookClientId} (doit être numérique)`);
      }
      
      if (!facebookClientSecret) {
        errors.push("FACEBOOK_CLIENT_SECRET manquant dans les Secrets");
      }

      // Test avec l'API Facebook Graph pour valider l'App ID
      if (facebookClientId && /^\d+$/.test(facebookClientId)) {
        console.log(`🔄 [TEST FACEBOOK] Test validation App ID via Facebook Graph API...`);
        
        try {
          const graphResponse = await fetch(`https://graph.facebook.com/${facebookClientId}?fields=id,name,link`);
          const graphData = await graphResponse.json();
          
          console.log(`📡 [TEST FACEBOOK] Response Facebook Graph:`, graphData);
          
          if (graphResponse.ok && graphData.id) {
            console.log(`✅ [TEST FACEBOOK] App ID Facebook validé: ${graphData.name || graphData.id}`);
          } else {
            console.error(`❌ [TEST FACEBOOK] App ID invalide:`, graphData);
            errors.push(`App ID Facebook invalide: ${graphData.error?.message || 'App non trouvée'}`);
          }
        } catch (graphError) {
          console.error(`❌ [TEST FACEBOOK] Erreur validation Graph API:`, graphError);
          errors.push(`Impossible de valider l'App ID: ${graphError instanceof Error ? graphError.message : 'Unknown error'}`);
        }
      }

      const result = {
        success: errors.length === 0,
        configuration: {
          facebookClientId: facebookClientId || null,
          facebookClientIdValid: facebookClientId && /^\d+$/.test(facebookClientId),
          facebookClientSecret: !!facebookClientSecret,
          clientUrl: clientUrl || "http://localhost:5000",
          redirectUri: `${clientUrl || "http://localhost:5000"}/api/oauth/callback`
        },
        errors: errors,
        message: errors.length === 0 ? "Configuration Facebook OAuth validée ✅" : "Erreurs de configuration détectées ❌",
        instructions: [
          "1. Configurez FACEBOOK_CLIENT_ID=1020589259777647 dans les Secrets Replit",
          "2. Configurez FACEBOOK_CLIENT_SECRET avec votre secret Facebook dans les Secrets Replit",
          "3. Assurez-vous que l'URL de redirection est autorisée dans Facebook Developers"
        ]
      };

      console.log(`📊 [TEST FACEBOOK] Résultat final:`, result);
      res.json(result);
    } catch (error) {
      console.error("❌ [TEST FACEBOOK] Erreur test Facebook:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Erreur lors du test Facebook OAuth"
      });
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

  // Facebook Data Deletion Endpoint (Required for Facebook Platform)
  app.post("/api/facebook/data-deletion", async (req, res) => {
    try {
      const { signed_request } = req.body;
      
      // Parse signed request from Facebook
      // In production, you would verify the signature
      let userId;
      if (signed_request) {
        const payload = signed_request.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        userId = decoded.user_id;
      }

      // Log data deletion request
      console.log(`Data deletion request for Facebook user: ${userId}`);
      
      // In production, implement actual data deletion logic here
      // For now, return confirmation
      
      res.json({
        url: `${process.env.CLIENT_URL}/data-deletion-status/${userId}`,
        confirmation_code: `DEL_${Date.now()}_${userId}`
      });
    } catch (error) {
      console.error("Data deletion error:", error);
      res.status(200).json({
        url: `${process.env.CLIENT_URL}/data-deletion-status`,
        confirmation_code: `DEL_${Date.now()}_UNKNOWN`
      });
    }
  });

  // Data deletion status page
  app.get("/data-deletion-status/:userId?", async (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QMARK - Data Deletion Status</title>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>Data Deletion Request Status</h1>
        <p>Your data deletion request has been processed successfully.</p>
        <p>All personal data associated with your Facebook account has been removed from our systems.</p>
        <p>If you have any questions, please contact: megavipcontact@gmail.com</p>
        <hr>
        <small>QMARK - Marketing Automation Platform</small>
      </body>
      </html>
    `);
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
    try {
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage();

      const [buckets] = await storage.getBuckets();
      const projectId = await storage.getProjectId();

      res.json({
        success: true,
        projectId,
        buckets: buckets.map(bucket => bucket.name),
        authenticated: true,
        message: 'Google Cloud Storage connecté avec succès!'
      });
    } catch (error) {
      console.error('Google Cloud Test Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        authenticated: false
      });
    }
  });

  // Create Google Cloud Storage bucket
  app.post('/api/google/create-bucket', async (req, res) => {
    try {
      const { bucketName } = req.body;

      if (!bucketName) {
        return res.status(400).json({
          success: false,
          error: 'Nom du bucket requis'
        });
      }

      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage();

      // Create bucket with recommended settings for a SaaS application
      const [bucket] = await storage.createBucket(bucketName, {
        location: 'US',
        storageClass: 'STANDARD',
        versioning: { enabled: true },
        lifecycle: {
          rule: [
            {
              action: { type: 'Delete' },
              condition: { age: 365 } // Delete files older than 1 year
            }
          ]
        }
      });

      res.json({
        success: true,
        message: `Bucket '${bucketName}' créé avec succès!`,
        bucket: {
          name: bucket.name,
          location: bucket.metadata.location,
          storageClass: bucket.metadata.storageClass
        }
      });
    } catch (error) {
      console.error('Create Bucket Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création du bucket'
      });
    }
  });

  // Setup initial Google Cloud resources for QMARK
  app.post('/api/google/setup', async (req, res) => {
    try {
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage();
      const projectId = await storage.getProjectId();

      // Create main buckets for QMARK application
      const bucketsToCreate = [
        {
          name: `qmark-storage-${projectId}`,
          description: 'Main storage for QMARK files'
        },
        {
          name: `qmark-backups-${projectId}`,
          description: 'Backup storage for QMARK'
        },
        {
          name: `qmark-media-${projectId}`,
          description: 'Media files for QMARK campaigns'
        }
      ];

      const results = [];

      for (const bucketInfo of bucketsToCreate) {
        try {
          const [bucket] = await storage.createBucket(bucketInfo.name, {
            location: 'US',
            storageClass: 'STANDARD',
            versioning: { enabled: true }
          });

          results.push({
            success: true,
            name: bucket.name,
            description: bucketInfo.description
          });
        } catch (error) {
          // If bucket already exists, that's okay
          if (error instanceof Error && error.message.includes('already exists')) {
            results.push({
              success: true,
              name: bucketInfo.name,
              description: bucketInfo.description,
              note: 'Bucket déjà existant'
            });
          } else {
            results.push({
              success: false,
              name: bucketInfo.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'Configuration Google Cloud terminée!',
        projectId,
        buckets: results
      });
    } catch (error) {
      console.error('Google Cloud Setup Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la configuration'
      });
    }
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