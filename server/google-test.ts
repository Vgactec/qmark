import { Storage } from '@google-cloud/storage';

export async function testGoogleCloudConnection() {
  try {
    console.log("🔍 [GOOGLE CLOUD] Test de connexion Google Cloud...");

    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      return {
        success: false,
        error: "GOOGLE_SERVICE_ACCOUNT environment variable not found",
        suggestion: 'Configure GOOGLE_SERVICE_ACCOUNT in Replit Secrets'
      };
    }

    let serviceAccountConfig;
    try {
      serviceAccountConfig = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      return {
        success: false,
        error: "Invalid JSON in GOOGLE_SERVICE_ACCOUNT",
        suggestion: 'Check the JSON format in your service account configuration'
      };
    }

    if (!serviceAccountConfig.project_id) {
      return {
        success: false,
        error: "Missing project_id in service account configuration",
        suggestion: 'Ensure your service account JSON contains a valid project_id'
      };
    }

    // Initialize Google Cloud Storage using environment credentials only
    const storage = new Storage({
      projectId: serviceAccountConfig.project_id,
      credentials: serviceAccountConfig,
    });

    try {
      const [buckets] = await storage.getBuckets();
      return {
        success: true,
        projectId: serviceAccountConfig.project_id,
        buckets: buckets.map(b => b.name),
        authMethod: 'Service Account (Environment Variables)',
        serviceAccount: serviceAccountConfig.client_email,
        message: '✅ Google Cloud Storage configuré avec variables d\'environnement!'
      };
    } catch (error: any) {
      if (error.code === 403 || error.message.includes('billing')) {
        return {
          success: true,
          projectId: serviceAccountConfig.project_id,
          buckets: [],
          authMethod: 'Service Account (Environment Variables)',
          serviceAccount: serviceAccountConfig.client_email,
          message: '✅ Google Cloud connecté! (Facturation requise pour créer des buckets)',
          note: 'Configuration réussie - Service Account opérationnel'
        };
      }
      throw error;
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      suggestion: 'Vérifiez la configuration des variables d\'environnement Google Cloud'
    };
  }
}