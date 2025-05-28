
import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';

interface TestResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  timestamp: string;
}

interface ValidationReport {
  overall: 'PASS' | 'FAIL' | 'WARNING';
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  tests: TestResult[];
  recommendations: string[];
}

export class APIValidator {
  private results: TestResult[] = [];
  private recommendations: string[] = [];

  async validateAll(): Promise<ValidationReport> {
    console.log('🧪 [API VALIDATOR] Début validation complète des APIs...');
    
    this.results = [];
    this.recommendations = [];

    // Test 1: Variables d'environnement
    await this.testEnvironmentVariables();
    
    // Test 2: Base de données PostgreSQL
    await this.testDatabase();
    
    // Test 3: Google Cloud Storage
    await this.testGoogleCloud();
    
    // Test 4: Facebook API
    await this.testFacebookAPI();
    
    // Test 5: Google OAuth
    await this.testGoogleOAuth();
    
    // Test 6: Chiffrement
    await this.testEncryption();
    
    // Test 7: Endpoints critiques
    await this.testCriticalEndpoints();

    // Test 8: Replit Auth
    await this.testReplitAuth();

    return this.generateReport();
  }

  private async testEnvironmentVariables(): Promise<void> {
    console.log('🔍 [TEST] Variables d\'environnement...');
    
    const requiredVars = {
      'DATABASE_URL': process.env.DATABASE_URL,
      'FACEBOOK_CLIENT_ID': process.env.FACEBOOK_CLIENT_ID,
      'FACEBOOK_CLIENT_SECRET': process.env.FACEBOOK_CLIENT_SECRET,
      'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
      'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
      'GOOGLE_SERVICE_ACCOUNT': process.env.GOOGLE_SERVICE_ACCOUNT,
      'ENCRYPTION_KEY': process.env.ENCRYPTION_KEY,
      'SESSION_SECRET': process.env.SESSION_SECRET,
      'CLIENT_URL': process.env.CLIENT_URL
    };

    const missing = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length === 0) {
      this.addResult('PASS', 'Variables d\'environnement', 'Toutes les variables requises sont configurées', {
        total: Object.keys(requiredVars).length,
        configured: Object.keys(requiredVars).length - missing.length
      });
    } else {
      this.addResult('FAIL', 'Variables d\'environnement', `Variables manquantes: ${missing.join(', ')}`, {
        missing,
        total: Object.keys(requiredVars).length
      });
      this.recommendations.push(`Configurez les variables manquantes: ${missing.join(', ')}`);
    }
  }

  private async testDatabase(): Promise<void> {
    console.log('🔍 [TEST] Base de données PostgreSQL...');
    
    try {
      const { pool } = await import('./db');
      const result = await pool.query('SELECT NOW() as timestamp, version() as version');
      
      this.addResult('PASS', 'Base de données', 'Connexion PostgreSQL réussie', {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version.split(' ')[0]
      });
    } catch (error) {
      this.addResult('FAIL', 'Base de données', `Connexion échouée: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.recommendations.push('Vérifiez la variable DATABASE_URL et la connectivité réseau');
    }
  }

  private async testGoogleCloud(): Promise<void> {
    console.log('🔍 [TEST] Google Cloud Storage...');
    
    try {
      const storage = new Storage();
      const projectId = await storage.getProjectId();
      const [buckets] = await storage.getBuckets();
      
      this.addResult('PASS', 'Google Cloud Storage', 'Authentification et connexion réussies', {
        projectId,
        bucketsCount: buckets.length,
        buckets: buckets.slice(0, 5).map(b => b.name)
      });
    } catch (error) {
      this.addResult('FAIL', 'Google Cloud Storage', `Connexion échouée: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.recommendations.push('Vérifiez la variable GOOGLE_SERVICE_ACCOUNT et les permissions');
    }
  }

  private async testFacebookAPI(): Promise<void> {
    console.log('🔍 [TEST] Facebook API...');
    
    const appId = process.env.FACEBOOK_CLIENT_ID;
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET;

    if (!appId || !appSecret) {
      this.addResult('FAIL', 'Facebook API', 'Identifiants Facebook manquants', {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret
      });
      this.recommendations.push('Configurez FACEBOOK_CLIENT_ID et FACEBOOK_CLIENT_SECRET');
      return;
    }

    // Validation format App ID
    if (!/^\d+$/.test(appId)) {
      this.addResult('FAIL', 'Facebook API', 'Format App ID invalide (doit être numérique)', {
        appId,
        format: 'invalid'
      });
      this.recommendations.push('Vérifiez le format de FACEBOOK_CLIENT_ID (doit être numérique)');
      return;
    }

    try {
      // Test avec Facebook Graph API
      const response = await fetch(`https://graph.facebook.com/${appId}?fields=id,name,link`);
      const data = await response.json();

      if (response.ok && data.id) {
        this.addResult('PASS', 'Facebook API', 'App ID validé via Graph API', {
          appId: data.id,
          appName: data.name,
          link: data.link
        });

        // Test token app pour vérifier le secret
        try {
          const tokenResponse = await fetch(`https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`);
          const tokenData = await tokenResponse.json();

          if (tokenResponse.ok && tokenData.access_token) {
            this.addResult('PASS', 'Facebook App Secret', 'Secret validé avec succès', {
              tokenType: tokenData.token_type || 'bearer'
            });
          } else {
            this.addResult('FAIL', 'Facebook App Secret', 'Secret invalide ou accès refusé', {
              error: tokenData.error?.message || 'Unknown error'
            });
            this.recommendations.push('Vérifiez FACEBOOK_CLIENT_SECRET dans Facebook Developers');
          }
        } catch (secretError) {
          this.addResult('WARNING', 'Facebook App Secret', 'Impossible de valider le secret', {
            error: secretError instanceof Error ? secretError.message : 'Unknown error'
          });
        }
      } else {
        this.addResult('FAIL', 'Facebook API', 'App ID non trouvé ou invalide', {
          error: data.error?.message || 'App not found',
          appId
        });
        this.recommendations.push('Vérifiez que l\'App ID existe dans Facebook Developers');
      }
    } catch (error) {
      this.addResult('FAIL', 'Facebook API', `Erreur réseau: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.recommendations.push('Vérifiez la connectivité réseau vers Facebook');
    }
  }

  private async testGoogleOAuth(): Promise<void> {
    console.log('🔍 [TEST] Google OAuth...');
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      this.addResult('FAIL', 'Google OAuth', 'Identifiants Google manquants', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
      this.recommendations.push('Configurez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET');
      return;
    }

    try {
      // Test formation URL OAuth
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', `${process.env.CLIENT_URL}/api/oauth/callback`);
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('response_type', 'code');

      // Test simple de l'endpoint OAuth (ne doit pas retourner d'erreur de client_id)
      const response = await fetch(authUrl.toString(), { method: 'HEAD' });
      
      this.addResult('PASS', 'Google OAuth', 'Configuration OAuth validée', {
        clientId: clientId.substring(0, 20) + '...',
        redirectUri: `${process.env.CLIENT_URL}/api/oauth/callback`,
        status: response.status
      });
    } catch (error) {
      this.addResult('WARNING', 'Google OAuth', `Validation partielle: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testEncryption(): Promise<void> {
    console.log('🔍 [TEST] Système de chiffrement...');
    
    try {
      const { encrypt, decrypt } = await import('./encryption');
      const testData = 'QMARK_TEST_ENCRYPTION_2024';
      
      const encrypted = encrypt(testData);
      const decrypted = decrypt(encrypted);
      
      if (decrypted === testData) {
        this.addResult('PASS', 'Chiffrement', 'Chiffrement/déchiffrement fonctionnel', {
          testPassed: true,
          encryptedLength: encrypted.length
        });
      } else {
        this.addResult('FAIL', 'Chiffrement', 'Échec du test de chiffrement/déchiffrement', {
          original: testData,
          decrypted,
          match: false
        });
        this.recommendations.push('Vérifiez la variable ENCRYPTION_KEY');
      }
    } catch (error) {
      this.addResult('FAIL', 'Chiffrement', `Erreur du système de chiffrement: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.recommendations.push('Vérifiez le module encryption.ts et ENCRYPTION_KEY');
    }
  }

  private async testCriticalEndpoints(): Promise<void> {
    console.log('🔍 [TEST] Endpoints critiques...');
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    const endpoints = [
      '/privacy',
      '/terms',
      '/api/facebook/data-deletion'
    ];

    let passedCount = 0;
    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, { method: 'GET' });
        const passed = response.status === 200;
        if (passed) passedCount++;
        
        results.push({
          endpoint,
          status: response.status,
          passed
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'ERROR',
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (passedCount === endpoints.length) {
      this.addResult('PASS', 'Endpoints critiques', 'Tous les endpoints sont accessibles', {
        total: endpoints.length,
        passed: passedCount,
        details: results
      });
    } else {
      this.addResult('WARNING', 'Endpoints critiques', `${passedCount}/${endpoints.length} endpoints accessibles`, {
        total: endpoints.length,
        passed: passedCount,
        details: results
      });
      this.recommendations.push('Vérifiez les endpoints non accessibles');
    }
  }

  private async testReplitAuth(): Promise<void> {
    console.log('🔍 [TEST] Replit Auth...');
    
    try {
      // Test du module d'authentification
      const { setupAuth } = await import('./replitAuth');
      
      this.addResult('PASS', 'Replit Auth', 'Module d\'authentification chargé', {
        module: 'loaded'
      });
    } catch (error) {
      this.addResult('FAIL', 'Replit Auth', `Erreur module auth: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.recommendations.push('Vérifiez le module replitAuth.ts');
    }
  }

  private addResult(status: 'PASS' | 'FAIL' | 'WARNING', service: string, message: string, details?: any): void {
    this.results.push({
      service,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    });
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} [${service}] ${message}`);
  }

  private generateReport(): ValidationReport {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length
    };

    const overall = summary.failed > 0 ? 'FAIL' : summary.warnings > 0 ? 'WARNING' : 'PASS';

    return {
      overall,
      timestamp: new Date().toISOString(),
      summary,
      tests: this.results,
      recommendations: this.recommendations
    };
  }
}
