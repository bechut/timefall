import { AES, enc } from 'crypto-js';

export function encrypt_AES(data: string): string {
  return AES.encrypt(JSON.stringify(data), process.env.AES_SECRET).toString();
}

export function decrypt_AES(data: string): string {
  const bytes = AES.decrypt(data, process.env.AES_SECRET);
  const originalText = bytes.toString(enc.Utf8);
  return originalText.replaceAll('"', '');
}
