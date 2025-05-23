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
}

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  facebook: {
    clientId: "586039034025653",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    redirectUri: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/oauth/callback`,
    scopes: ["pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish"],
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/oauth/callback`,
    appName: "QMARK",
    supportEmail: "ygacofficiel@gmail.com",
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
    clientId: "586039034025653",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    redirectUri: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/oauth/callback`,
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

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const config = OAUTH_CONFIGS[platform];
    if (!config) {
      return res.status(400).json({ message: "Platform not supported" });
    }

    const state = `${userId}:${platform}:${Date.now()}`;
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", config.redirectUri);
    authUrl.searchParams.set("scope", config.scopes.join(" "));
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("OAuth initiation error:", error);
    res.status(500).json({ message: "Failed to initiate OAuth" });
  }
}

export async function handleOAuthCallback(req: Request, res: Response) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({ message: `OAuth error: ${error}` });
    }

    if (!code || !state) {
      return res.status(400).json({ message: "Missing authorization code or state" });
    }

    const [userId, platform] = (state as string).split(":");
    const config = OAUTH_CONFIGS[platform];

    if (!config) {
      return res.status(400).json({ message: "Invalid platform" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code as string,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
    }

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