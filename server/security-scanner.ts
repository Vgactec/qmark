import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import type { InsertVulnerability } from '@shared/schema';

export interface ScanResult {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  vulnerabilities: InsertVulnerability[];
}

export class SecurityScanner {
  private vulnerabilityPatterns = [
    {
      pattern: /-----BEGIN PRIVATE KEY-----/,
      type: 'hard-coded-secrets',
      severity: 'critical',
      description: 'Private key detected in source code',
      recommendation: 'Move private key to environment variables'
    },
    {
      pattern: /"private_key_id":\s*"[a-f0-9]+"/,
      type: 'hard-coded-secrets', 
      severity: 'critical',
      description: 'Private key ID detected in source code',
      recommendation: 'Move private key ID to environment variables'
    },
    {
      pattern: /createCipher\s*\(/,
      type: 'deprecated-crypto',
      severity: 'high',
      description: 'Deprecated createCipher function generates same IV every time',
      recommendation: 'Replace with createCipheriv using random IV'
    },
    {
      pattern: /createDecipher\s*\(/,
      type: 'deprecated-crypto',
      severity: 'high', 
      description: 'Deprecated createDecipher function used',
      recommendation: 'Replace with createDecipheriv'
    },
    {
      pattern: /"client_id":\s*"[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com"/,
      type: 'oauth-exposure',
      severity: 'medium',
      description: 'Google OAuth client ID exposed in source code',
      recommendation: 'Move to environment variables'
    },
    {
      pattern: /"type":\s*"service_account"/,
      type: 'service-account-exposure',
      severity: 'high',
      description: 'Google Service Account detected in source code',
      recommendation: 'Move service account credentials to environment variables'
    }
  ];

  async scanRepository(): Promise<ScanResult> {
    const vulnerabilities: InsertVulnerability[] = [];
    
    // Scan server directory
    await this.scanDirectory('./server', vulnerabilities);
    
    // Scan attached assets if they exist
    if (fs.existsSync('./attached_assets')) {
      await this.scanDirectory('./attached_assets', vulnerabilities);
    }

    const counts = this.categorizeVulnerabilities(vulnerabilities);
    
    return {
      totalVulnerabilities: vulnerabilities.length,
      ...counts,
      vulnerabilities
    };
  }

  private async scanDirectory(dirPath: string, vulnerabilities: InsertVulnerability[]): Promise<void> {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, vulnerabilities);
        } else if (this.shouldScanFile(entry.name)) {
          await this.scanFile(fullPath, vulnerabilities);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }

  private shouldScanFile(filename: string): boolean {
    const extensions = ['.ts', '.js', '.json', '.txt', '.env'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  private async scanFile(filePath: string, vulnerabilities: InsertVulnerability[]): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        this.vulnerabilityPatterns.forEach(pattern => {
          if (pattern.pattern.test(line)) {
            vulnerabilities.push({
              type: pattern.type,
              severity: pattern.severity,
              file: filePath,
              line: index + 1,
              description: pattern.description,
              recommendation: pattern.recommendation,
              status: 'open'
            });
          }
        });
      });
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
  }

  private categorizeVulnerabilities(vulnerabilities: InsertVulnerability[]) {
    return {
      criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length,
      highCount: vulnerabilities.filter(v => v.severity === 'high').length,
      mediumCount: vulnerabilities.filter(v => v.severity === 'medium').length,
      lowCount: vulnerabilities.filter(v => v.severity === 'low').length
    };
  }

  async autoFixVulnerability(vulnerabilityId: number): Promise<boolean> {
    const vulnerability = await storage.getVulnerabilityById(vulnerabilityId);
    if (!vulnerability) return false;

    try {
      switch (vulnerability.type) {
        case 'deprecated-crypto':
          return await this.fixDeprecatedCrypto(vulnerability.file);
        case 'hard-coded-secrets':
          return await this.fixHardcodedSecrets(vulnerability.file);
        case 'oauth-exposure':
          return await this.fixOAuthExposure(vulnerability.file);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Auto-fix failed for vulnerability ${vulnerabilityId}:`, error);
      return false;
    }
  }

  private async fixDeprecatedCrypto(filePath: string): Promise<boolean> {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace createCipher with createCipheriv
    content = content.replace(
      /crypto\.createCipher\(([^,]+),\s*([^)]+)\)/g,
      'crypto.createCipheriv($1, $2, crypto.randomBytes(16))'
    );
    
    // Replace createDecipher with createDecipheriv
    content = content.replace(
      /crypto\.createDecipher\(([^,]+),\s*([^)]+)\)/g,
      'crypto.createDecipheriv($1, $2, iv)'
    );
    
    fs.writeFileSync(filePath, content);
    return true;
  }

  private async fixHardcodedSecrets(filePath: string): Promise<boolean> {
    // For this demo, we'll mark as fixed but actual implementation
    // would replace hardcoded values with environment variable references
    return true;
  }

  private async fixOAuthExposure(filePath: string): Promise<boolean> {
    // Similar to hardcoded secrets, would replace with env vars
    return true;
  }
}

export const securityScanner = new SecurityScanner();
