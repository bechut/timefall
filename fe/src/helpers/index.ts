import { AES, enc } from "crypto-js";

export class Helpers {
  encrypt_AES(data: string): string {
    return AES.encrypt(
      JSON.stringify(data),
      process.env.REACT_APP_AES_SECRET || ""
    ).toString();
  }

  decrypt_AES(data: string): string {
    const bytes = AES.decrypt(data, process.env.REACT_APP_AES_SECRET || "");
    const originalText = bytes.toString(enc.Utf8);
    return originalText;
  }
}

export const helpers = new Helpers();
