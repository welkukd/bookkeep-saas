/**
 * Client-side encryption for local-first privacy
 * Uses Web Crypto API (SubtleCrypto) for AES-GCM encryption
 * Data is encrypted before sending to server, decrypted after receiving
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

// Derive encryption key from user's master password + salt
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate random salt
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Generate random IV
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

// Helper: Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
}

// Helper: base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Encrypt data
export async function encryptData(
  data: string | object,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const encoded = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  return {
    encrypted: uint8ArrayToBase64(new Uint8Array(encrypted)),
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
  };
}

// Decrypt data
export async function decryptData(
  encryptedData: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  const key = await deriveKey(password, base64ToUint8Array(salt));

  const encrypted = base64ToUint8Array(encryptedData);
  const ivBytes = base64ToUint8Array(iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Encrypt for storage (uses app-level key from env)
const APP_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

export async function encryptForStorage(data: string | object): Promise<string> {
  const { encrypted, salt, iv } = await encryptData(data, APP_ENCRYPTION_KEY);
  return JSON.stringify({ encrypted, salt, iv });
}

export async function decryptFromStorage(encryptedJson: string): Promise<string> {
  const { encrypted, salt, iv } = JSON.parse(encryptedJson);
  return decryptData(encrypted, salt, iv, APP_ENCRYPTION_KEY);
}

// Field-level encryption for sensitive transaction fields
export async function encryptSensitiveFields(
  transaction: Record<string, unknown>,
  password: string
): Promise<Record<string, unknown>> {
  const sensitiveFields = ['description', 'merchant', 'notes', 'tags'];
  const result = { ...transaction };

  for (const field of sensitiveFields) {
    if (result[field] !== undefined && result[field] !== null) {
      const { encrypted, salt, iv } = await encryptData(String(result[field]), password);
      result[`${field}_encrypted`] = { encrypted, salt, iv };
      delete result[field];
    }
  }

  return result;
}

export async function decryptSensitiveFields(
  transaction: Record<string, unknown>,
  password: string
): Promise<Record<string, unknown>> {
  const result = { ...transaction };

  for (const key of Object.keys(result)) {
    if (key.endsWith('_encrypted') && typeof result[key] === 'object') {
      const field = key.replace('_encrypted', '');
      const { encrypted, salt, iv } = result[key] as { encrypted: string; salt: string; iv: string };
      result[field] = await decryptData(encrypted, salt, iv, password);
      delete result[key];
    }
  }

  return result;
}

// Local storage encryption helpers
export const SecureStorage = {
  async set(key: string, value: unknown, password: string): Promise<void> {
    const { encrypted, salt, iv } = await encryptData(JSON.stringify(value), password);
    const payload = JSON.stringify({ encrypted, salt, iv, timestamp: Date.now() });
    localStorage.setItem(`secure_${key}`, payload);
  },

  async get<T>(key: string, password: string): Promise<T | null> {
    const item = localStorage.getItem(`secure_${key}`);
    if (!item) return null;

    try {
      const { encrypted, salt, iv } = JSON.parse(item);
      const decrypted = await decryptData(encrypted, salt, iv, password);
      return JSON.parse(decrypted) as T;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  },

  clear(): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  },
};

// Offline queue for mutations
export interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export const OfflineQueue = {
  async add(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queue = await this.getAll();
    queue.push({
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    });
    await this.save(queue);
  },

  async getAll(): Promise<QueuedMutation[]> {
    const item = localStorage.getItem('offline_queue');
    if (!item) return [];
    try {
      return JSON.parse(item);
    } catch {
      return [];
    }
  },

  async save(queue: QueuedMutation[]): Promise<void> {
    localStorage.setItem('offline_queue', JSON.stringify(queue));
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getAll();
    await this.save(queue.filter((m) => m.id !== id));
  },

  async clear(): Promise<void> {
    localStorage.removeItem('offline_queue');
  },

  async incrementRetry(id: string): Promise<void> {
    const queue = await this.getAll();
    const mutation = queue.find((m) => m.id === id);
    if (mutation) {
      mutation.retries += 1;
      await this.save(queue);
    }
  },
};

// Sync status
export interface SyncStatus {
  lastSync: number | null;
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastError: string | null;
}

export const SyncManager = {
  getStatus(): SyncStatus {
    if (typeof window === 'undefined') {
      return { lastSync: null, pendingCount: 0, isOnline: false, isSyncing: false, lastError: null };
    }
    return {
      lastSync: parseInt(localStorage.getItem('last_sync') || '0') || null,
      pendingCount: 0, // Will be updated by queue
      isOnline: navigator.onLine,
      isSyncing: false,
      lastError: localStorage.getItem('last_sync_error'),
    };
  },

  async updateStatus(updates: Partial<SyncStatus>): Promise<void> {
    const current = this.getStatus();
    const newStatus = { ...current, ...updates };
    localStorage.setItem('last_sync', newStatus.lastSync?.toString() || '');
    if (newStatus.lastError) {
      localStorage.setItem('last_sync_error', newStatus.lastError);
    } else {
      localStorage.removeItem('last_sync_error');
    }
  },

  async markSynced(): Promise<void> {
    localStorage.setItem('last_sync', Date.now().toString());
  },
};