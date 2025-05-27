import { Storage } from '@google-cloud/storage';

export async function testGoogleCloudConnection(): Promise<TestResult> {
  try {
    // Parse the service account to get project ID
    let projectId = "neurax-460419"; // Default fallback

    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        projectId = serviceAccount.project_id;
      } catch (e) {
        console.warn("Could not parse GOOGLE_SERVICE_ACCOUNT, using fallback project ID");
      }
    }

    const storage = new Storage({
      projectId: projectId,
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT) : undefined
    });

    // Test basic authentication with explicit project
    const [buckets] = await storage.getBuckets();

    return {
      status: "✅ PASS",
      details: {
        authenticated: true,
        projectId: projectId,
        bucketsCount: buckets.length
      }
    };
  } catch (error: any) {
    return {
      status: "❌ FAIL",
      details: {
        error: error.message
      }
    };
  }
}