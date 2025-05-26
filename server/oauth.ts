import { Request, Response } from "express";
import { storage } from "./storage";
import { encrypt, decrypt } from "./encryption";

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  appName?: string;
  supportEmail?: string;
}

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID || "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    redirectUri: `${process.env.CLIENT_URL || "http://localhost:5000"}/api/oauth/callback`,
    scopes: ["pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish"],
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: `${process.env.CLIENT_URL || "http://localhost:5000"}/api/oauth/callback`,
    appName: "QMARK",
    supportEmail: process.env.SUPPORT_EMAIL || "support@example.com",
    scopes: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/devstorage.full_control"
    ],
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth", 
    tokenUrl: "https://oauth2.googleapis.com/token",
  },
  whatsapp: {
    clientId: process.env.FACEBOOK_CLIENT_ID || "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    redirectUri: `${process.env.CLIENT_URL || "http://localhost:5000"}/api/oauth/callback`,
    scopes: ["whatsapp_business_messaging"],
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  },
  telegram: {
    clientId: process.env.TELEGRAM_BOT_TOKEN || "",
    clientSecret: process.env.TELEGRAM_BOT_SECRET || "",
    redirectUri: process.env.TELEGRAM_REDIRECT_URI || "",
    scopes: ["bot"],
    authUrl: "https://oauth.telegram.org/auth",
    tokenUrl: "https://api.telegram.org/bot",
  },
};

export async function initiateOAuth(req: Request, res: Response) {
  try {
    const { platform } = req.params;
    const userId = (req.user as any)?.claims?.sub;

    console.log(`🔵 [OAUTH] Initiation OAuth pour ${platform.toUpperCase()}`);
    console.log(`🔵 [OAUTH] User ID: ${userId}`);

    if (!userId) {
      console.error("❌ [OAUTH] Utilisateur non authentifié");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const config = OAUTH_CONFIGS[platform];
    if (!config) {
      console.error(`❌ [OAUTH] Plateforme ${platform} non supportée`);
      return res.status(400).json({ message: "Platform not supported" });
    }

    // Validation spéciale pour Facebook
    if (platform === "facebook" || platform === "whatsapp") {
      console.log(`🔍 [FACEBOOK] Validation configuration Facebook...`);
      console.log(`🔍 [FACEBOOK] CLIENT_ID configuré: ${config.clientId ? '✅ OUI' : '❌ NON'}`);
      console.log(`🔍 [FACEBOOK] CLIENT_SECRET configuré: ${config.clientSecret ? '✅ OUI' : '❌ NON'}`);
      console.log(`🔍 [FACEBOOK] REDIRECT_URI: ${config.redirectUri}`);
      
      if (!config.clientId || config.clientId === "") {
        console.error("❌ [FACEBOOK] FACEBOOK_CLIENT_ID manquant dans les secrets!");
        return res.status(500).json({ 
          message: "Facebook Client ID manquant. Configurez FACEBOOK_CLIENT_ID dans les Secrets Replit.",
          debug: "FACEBOOK_CLIENT_ID non configuré"
        });
      }
      
      if (!config.clientSecret || config.clientSecret === "") {
        console.error("❌ [FACEBOOK] FACEBOOK_CLIENT_SECRET manquant dans les secrets!");
        return res.status(500).json({ 
          message: "Facebook Client Secret manquant. Configurez FACEBOOK_CLIENT_SECRET dans les Secrets Replit.",
          debug: "FACEBOOK_CLIENT_SECRET non configuré"
        });
      }

      // Validation de l'App ID Facebook (doit être numérique)
      if (!/^\d+$/.test(config.clientId)) {
        console.error(`❌ [FACEBOOK] App ID invalide: ${config.clientId}`);
        return res.status(500).json({ 
          message: "Facebook App ID invalide. Doit être numérique.",
          debug: `App ID fourni: ${config.clientId}`
        });
      }

      console.log(`✅ [FACEBOOK] Configuration Facebook validée`);
      console.log(`✅ [FACEBOOK] App ID: ${config.clientId}`);
    }

    const state = `${userId}:${platform}:${Date.now()}`;
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", config.redirectUri);
    authUrl.searchParams.set("scope", config.scopes.join(" "));
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);
    
    // Paramètres spécifiques pour Google OAuth
    if (platform === "google") {
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      console.log(`🔵 [GOOGLE] Paramètres OAuth Google configurés`);
    }

    const finalAuthUrl = authUrl.toString();
    console.log(`✅ [OAUTH] URL OAuth générée avec succès pour ${platform.toUpperCase()}`);
    console.log(`🔗 [OAUTH] URL: ${finalAuthUrl.substring(0, 100)}...`);

    res.json({ authUrl: finalAuthUrl });
  } catch (error) {
    console.error(`❌ [OAUTH] Erreur lors de l'initiation OAuth:`, error);
    res.status(500).json({ 
      message: "Failed to initiate OAuth",
      debug: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function handleOAuthCallback(req: Request, res: Response) {
  try {
    const { code, state, error, error_description } = req.query;

    console.log(`🔵 [OAUTH CALLBACK] Traitement du callback OAuth...`);
    console.log(`🔵 [OAUTH CALLBACK] Code reçu: ${code ? '✅ OUI' : '❌ NON'}`);
    console.log(`🔵 [OAUTH CALLBACK] State reçu: ${state ? '✅ OUI' : '❌ NON'}`);

    if (error) {
      console.error(`❌ [OAUTH CALLBACK] Erreur OAuth reçue: ${error}`);
      console.error(`❌ [OAUTH CALLBACK] Description: ${error_description || 'Aucune description'}`);
      return res.status(400).json({ 
        message: `OAuth error: ${error}`,
        description: error_description,
        debug: `Erreur du provider: ${error}`
      });
    }

    if (!code || !state) {
      console.error(`❌ [OAUTH CALLBACK] Paramètres manquants - Code: ${!!code}, State: ${!!state}`);
      return res.status(400).json({ message: "Missing authorization code or state" });
    }

    const [userId, platform] = (state as string).split(":");
    console.log(`🔍 [OAUTH CALLBACK] Platform: ${platform}, User ID: ${userId}`);
    
    const config = OAUTH_CONFIGS[platform];

    if (!config) {
      console.error(`❌ [OAUTH CALLBACK] Configuration manquante pour ${platform}`);
      return res.status(400).json({ message: "Invalid platform" });
    }

    console.log(`✅ [OAUTH CALLBACK] Configuration trouvée pour ${platform}`);
    console.log(`🔄 [OAUTH CALLBACK] Échange du code contre un token...`);

    // Exchange code for access token
    console.log(`🔄 [TOKEN EXCHANGE] Envoi requête vers: ${config.tokenUrl}`);
    
    const tokenRequestBody = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code as string,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    };

    console.log(`🔄 [TOKEN EXCHANGE] Paramètres: client_id=${config.clientId}, redirect_uri=${config.redirectUri}`);

    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenRequestBody),
    });

    console.log(`📡 [TOKEN EXCHANGE] Status response: ${tokenResponse.status}`);

    const tokenData = await tokenResponse.json();
    console.log(`📡 [TOKEN EXCHANGE] Response reçue:`, { 
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      error: tokenData.error,
      errorDescription: tokenData.error_description
    });

    if (!tokenResponse.ok) {
      console.error(`❌ [TOKEN EXCHANGE] Échec échange token:`, tokenData);
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
    }

    console.log(`✅ [TOKEN EXCHANGE] Token obtenu avec succès pour ${platform}`);

    // Get user info from the platform
    let userInfo: any = {};
    if (platform === "facebook" || platform === "whatsapp") {
      const userResponse = await fetch(
        `https://graph.facebook.com/me?access_token=${tokenData.access_token}&fields=id,name,email`
      );
      userInfo = await userResponse.json();
    } else if (platform === "google") {
      const userResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
      );
      userInfo = await userResponse.json();
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;

    // Store connection in database
    await storage.createOauthConnection({
      userId,
      platform,
      platformUserId: userInfo.id,
      displayName: userInfo.name,
      email: userInfo.email,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      scope: config.scopes.join(" "),
      isActive: true,
      lastSync: new Date(),
    });

    // Create activity record
    await storage.createActivity({
      userId,
      type: "oauth_connected",
      title: "Nova conexão OAuth2",
      description: `Conectado com ${platform} como ${userInfo.name || userInfo.email}`,
      metadata: { platform, platformUserId: userInfo.id },
    });

    res.redirect(`${process.env.CLIENT_URL || ""}/?connected=${platform}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({ message: "Failed to complete OAuth flow" });
  }
}

export async function refreshOAuthToken(connectionId: number): Promise<boolean> {
  try {
    const connection = await storage.getOauthConnection(connectionId);
    if (!connection || !connection.refreshToken) {
      return false;
    }

    const config = OAUTH_CONFIGS[connection.platform];
    if (!config) {
      return false;
    }

    const decryptedRefreshToken = decrypt(connection.refreshToken);

    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: decryptedRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token refresh failed:", tokenData);
      return false;
    }

    // Update connection with new tokens
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token
      ? encrypt(tokenData.refresh_token)
      : connection.refreshToken;

    await storage.updateOauthConnection(connectionId, {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      lastSync: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Token refresh error:", error);
    return false;
  }
}

export async function getDecryptedAccessToken(connectionId: number): Promise<string | null> {
  try {
    const connection = await storage.getOauthConnection(connectionId);
    if (!connection || !connection.accessToken) {
      return null;
    }

    // Check if token is expired and refresh if needed
    if (connection.tokenExpiry && new Date() >= connection.tokenExpiry) {
      const refreshed = await refreshOAuthToken(connectionId);
      if (!refreshed) {
        return null;
      }
      // Get updated connection
      const updatedConnection = await storage.getOauthConnection(connectionId);
      if (!updatedConnection?.accessToken) {
        return null;
      }
      return decrypt(updatedConnection.accessToken);
    }

    return decrypt(connection.accessToken);
  } catch (error) {
    console.error("Error getting decrypted access token:", error);
    return null;
  }
}