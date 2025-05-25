
import { Request, Response } from 'express';
import { google } from 'googleapis';

export async function testGoogleConnection(req: Request, res: Response) {
  try {
    // Create auth client using service account
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || ''),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const projectId = await auth.getProjectId();

    // Test connection by listing storage buckets
    const storage = google.storage({ version: 'v1', auth: client });
    const result = await storage.buckets.list({ project: projectId });

    res.json({
      success: true,
      projectId,
      buckets: result.data.items || []
    });
  } catch (error) {
    console.error('Google API Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
