// Local IndexedDB & in-memory storage for pulled GGUF models and Ollama registry

export interface StoredModel {
  id: string; // unique ID
  provider: 'huggingface' | 'ollama';
  name: string;
  fileName: string;
  repoId?: string;
  quant?: string;
  size: number; // in bytes
  downloadedAt: number;
  hasBlob: boolean;
  status: 'ready' | 'downloading' | 'proxy-managed';
  modelfile?: string;
}

const DB_NAME = 'nexus_model_db';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const BLOB_STORE_NAME = 'model_blobs';

// In-memory fallback if IndexedDB is unavailable or full
const inMemoryMetadata = new Map<string, StoredModel>();
const inMemoryBlobs = new Map<string, Blob>();

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE_NAME)) {
        db.createObjectStore(BLOB_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function saveModelToStorage(
  model: StoredModel,
  blob?: Blob
): Promise<{ success: boolean; storageType: 'indexeddb' | 'in-memory'; error?: string }> {
  try {
    const db = await getDB();

    return await new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME, BLOB_STORE_NAME], 'readwrite');
      const metaStore = tx.objectStore(STORE_NAME);
      const blobStore = tx.objectStore(BLOB_STORE_NAME);

      metaStore.put({ ...model, hasBlob: !!blob });

      if (blob) {
        blobStore.put(blob, model.id);
      }

      tx.oncomplete = () => {
        resolve({ success: true, storageType: 'indexeddb' });
      };

      tx.onerror = () => {
        // Fallback to in-memory
        inMemoryMetadata.set(model.id, { ...model, hasBlob: !!blob });
        if (blob) inMemoryBlobs.set(model.id, blob);
        resolve({
          success: true,
          storageType: 'in-memory',
          error: tx.error?.message || 'IndexedDB quota exceeded, saved in-memory',
        });
      };
    });
  } catch (err: any) {
    // In-memory fallback
    inMemoryMetadata.set(model.id, { ...model, hasBlob: !!blob });
    if (blob) inMemoryBlobs.set(model.id, blob);
    return {
      success: true,
      storageType: 'in-memory',
      error: err?.message || 'Saved to in-memory fallback',
    };
  }
}

export async function getStoredModels(): Promise<StoredModel[]> {
  try {
    const db = await getDB();
    const stored = await new Promise<StoredModel[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Merge in-memory entries if any
    const merged = new Map<string, StoredModel>();
    for (const item of stored) {
      merged.set(item.id, item);
    }
    for (const [id, item] of inMemoryMetadata.entries()) {
      merged.set(id, item);
    }

    return Array.from(merged.values()).sort((a, b) => b.downloadedAt - a.downloadedAt);
  } catch {
    return Array.from(inMemoryMetadata.values()).sort((a, b) => b.downloadedAt - a.downloadedAt);
  }
}

export async function getModelBlob(id: string): Promise<Blob | null> {
  if (inMemoryBlobs.has(id)) {
    return inMemoryBlobs.get(id) || null;
  }

  try {
    const db = await getDB();
    return await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(BLOB_STORE_NAME, 'readonly');
      const store = tx.objectStore(BLOB_STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteStoredModel(id: string): Promise<boolean> {
  inMemoryMetadata.delete(id);
  inMemoryBlobs.delete(id);

  try {
    const db = await getDB();
    return await new Promise<boolean>((resolve) => {
      const tx = db.transaction([STORE_NAME, BLOB_STORE_NAME], 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.objectStore(BLOB_STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return true;
  }
}

export async function getStorageQuotaInfo(): Promise<{ usage: number; quota: number; formatted: string }> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        usage,
        quota,
        formatted: `${formatBytes(usage)} used of ${formatBytes(quota)}`,
      };
    } catch {
      // Ignore
    }
  }
  return { usage: 0, quota: 0, formatted: 'IndexedDB storage available' };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
