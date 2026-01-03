
import CryptoJS from 'crypto-js';

export const EncryptedStorage = {
    setItem: (key: string, value: any, secretKey: string) => {
        try {
            const json = JSON.stringify(value);
            const encrypted = CryptoJS.AES.encrypt(json, secretKey).toString();
            localStorage.setItem(key, encrypted);
        } catch (e) {
            console.error('Encryption failed', e);
        }
    },

    getItem: (key: string, secretKey: string) => {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;

            const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            if (!decrypted) return null; // Decryption failed (wrong key)

            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Decryption failed', e);
            return null;
        }
    },

    removeItem: (key: string) => {
        localStorage.removeItem(key);
    },

    exists: (key: string) => {
        return localStorage.getItem(key) !== null;
    }
};
