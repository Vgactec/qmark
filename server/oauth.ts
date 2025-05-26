export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  facebook: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

export function getOAuthConfig(): OAuthConfig {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000';
  
  return {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/api/oauth/callback/google`
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/api/oauth/callback/facebook`
    }
  };
}

export function generateOAuthUrl(provider: 'google' | 'facebook', state?: string): string {
  const config = getOAuthConfig();
  const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
  
  switch (provider) {
    case 'google':
      return `https://accounts.google.com/oauth/authorize?` +
        `client_id=${config.google.clientId}&` +
        `redirect_uri=${encodeURIComponent(config.google.redirectUri)}&` +
        `scope=openid%20email%20profile&` +
        `response_type=code${stateParam}`;
        
    case 'facebook':
      return `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${config.facebook.clientId}&` +
        `redirect_uri=${encodeURIComponent(config.facebook.redirectUri)}&` +
        `scope=email&` +
        `response_type=code${stateParam}`;
        
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

export async function exchangeCodeForToken(provider: 'google' | 'facebook', code: string): Promise<any> {
  const config = getOAuthConfig();
  
  switch (provider) {
    case 'google':
      const googleResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.google.redirectUri,
        }),
      });
      
      if (!googleResponse.ok) {
        throw new Error('Failed to exchange Google code for token');
      }
      
      return await googleResponse.json();
      
    case 'facebook':
      const facebookResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.facebook.clientId,
          client_secret: config.facebook.clientSecret,
          code,
          redirect_uri: config.facebook.redirectUri,
        }),
      });
      
      if (!facebookResponse.ok) {
        throw new Error('Failed to exchange Facebook code for token');
      }
      
      return await facebookResponse.json();
      
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}
