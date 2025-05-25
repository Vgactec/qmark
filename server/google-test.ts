import { Storage } from '@google-cloud/storage';

export async function testGoogleCloud() {
  try {
    const storage = new Storage();
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