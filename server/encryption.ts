
import crypto from "crypto";

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Validate encryption key length
function validateEncryptionKey(key: string): boolean {
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    return keyBuffer.length === 32; // 256 bits = 32 bytes
  } catch {
    return false;
  }
}

if (!validateEncryptionKey(ENCRYPTION_KEY)) {
  console.error("❌ [ENCRYPTION] Invalid ENCRYPTION_KEY length. Must be 64 hex characters (32 bytes)");
  console.log("💡 Generate a new key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
}

export function encrypt(text: string): string {
  try {
    if (!validateEncryptionKey(ENCRYPTION_KEY)) {
      throw new Error('Invalid encryption key length');
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ [ENCRYPTION] Encrypt error:', error);
    throw new Error('Encryption failed: Invalid key length');
  }
}

export function decrypt(encryptedText: string): string {
  try {
    if (!validateEncryptionKey(ENCRYPTION_KEY)) {
      throw new Error('Invalid encryption key length');
    }
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('❌ [ENCRYPTION] Decrypt error:', error);
    throw new Error('Decryption failed: Invalid key or data');
  }
}

export function generateSecureKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
