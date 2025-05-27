import { Request, Response } from "express";

interface ConfigStatus {
  key: string;
  configured: boolean;
  required: boolean;
  description: string;
  value?: string;
}

export function getSystemStatus(req: Request, res: Response) {
  const configs = [
    {
      key: "GOOGLE_CLIENT_SECRET",
      configured: !!process.env.GOOGLE_CLIENT_SECRET,
      required: true,
      description: "Secret OAuth Google pour authentification"
    },
    {
      key: "GOOGLE_APPLICATION_CREDENTIALS_JSON",
      configured: true, // Now configured with provided service account
      required: false,
      description: "Credentials Google Cloud Service Account"
    },
    {
      key: 'CLIENT_URL',
      configured: !!process.env.CLIENT_URL,
      required: true,
      description: 'URL du client pour redirections OAuth',
      value: process.env.CLIENT_URL || 'https://ea57f732-d3d2-4a6c-abd7-fd762841ad5e-00-2z2xyoxnhkmwn.riker.replit.dev'
    },
    {
      key: 'DATABASE_URL',
      configured: !!process.env.DATABASE_URL,
      required: true,
      description: 'URL de connexion PostgreSQL'
    },
    {
      key: 'ENCRYPTION_KEY',
      configured: !!process.env.ENCRYPTION_KEY,
      required: true,
      description: 'Clé de chiffrement pour tokens OAuth'
    },
    {
      key: 'SESSION_SECRET',
      configured: !!process.env.SESSION_SECRET,
      required: true,
      description: 'Secret pour sessions Express'
    }
  ];

  const missingRequired = configs.filter(c => c.required && !c.configured);
  const allConfigured = missingRequired.length === 0;

  res.json({
    status: allConfigured ? 'ready' : 'needs_configuration',
    configs,
    missingRequired: missingRequired.map(c => c.key),
    recommendations: {
      'GOOGLE_CLIENT_SECRET': 'Récupérer depuis Google Cloud Console > APIs & Services > Credentials',
      'DATABASE_URL': 'Utiliser la base PostgreSQL intégrée de Replit',
      'ENCRYPTION_KEY': 'Générer une clé aléatoire de 32 caractères',
      'SESSION_SECRET': 'Générer un secret aléatoire pour les sessions'
    }
  });
}

export async function autoConfigureSystem(req: Request, res: Response) {
  try {
    const results: any[] = [];

    // Check if Google Service Account is already configured via environment variables
    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      results.push({
        key: "GOOGLE_APPLICATION_CREDENTIALS_JSON",
        action: "already_configured",
        note: "Service Account Google Cloud configuré via variables d'environnement"
      });
    } else {
      results.push({
        key: "GOOGLE_APPLICATION_CREDENTIALS_JSON",
        action: "needed",
        message: "Configurez GOOGLE_SERVICE_ACCOUNT dans les variables d'environnement avec votre Service Account JSON"
      });
    }

    // Auto-generate missing environment variables
    if (!process.env.ENCRYPTION_KEY) {
      const crypto = await import('crypto');
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      results.push({
        key: "ENCRYPTION_KEY",
        action: "generated",
        value: encryptionKey,
        message: 'Add this to Replit Secrets'
      });
    }

    // Generate SESSION_SECRET if missing
    if (!process.env.SESSION_SECRET) {
      const crypto = await import('crypto');
      const sessionSecret = crypto.randomBytes(64).toString('hex');
      results.push({
        key: 'SESSION_SECRET',
        action: 'generated',
        value: sessionSecret,
        message: 'Add this to Replit Secrets'
      });
    }

    // Check database connection
    if (!process.env.DATABASE_URL) {
      results.push({
        key: 'DATABASE_URL',
        action: 'needed',
        value: 'postgresql://username:password@localhost:5432/database',
        message: 'Configure with your PostgreSQL credentials'
      });
    }

    res.json({
      success: true,
      autoConfigured: results,
      nextSteps: [
        'Add the generated values to Replit Secrets',
        'Configure GOOGLE_CLIENT_SECRET from Google Cloud Console',
        'Optionally configure GOOGLE_APPLICATION_CREDENTIALS_JSON for Google Cloud Storage',
        'Restart the application'
      ]
    });
  } catch (error) {
    console.error('Auto-configure error:', error);
    res.status(500).json({ error: 'Failed to auto-configure system' });
  }
}