import { Storage } from '@google-cloud/storage';

export async function testGoogleCloudConnection() {
  try {
    // Get service account credentials from environment
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJson) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not found in environment variables');
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch (error) {
      throw new Error('Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }

    // Initialize Google Cloud Storage with service account credentials
    const storage = new Storage({
      projectId: 'neurax-460419',
      credentials: credentials,
    });
    const [buckets] = await storage.getBuckets();
    return {
      success: true,
      projectId: storage.projectId,
      buckets: buckets.map(b => b.name)
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}