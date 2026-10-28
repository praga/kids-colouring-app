import { DrawingAction, PageDrawingState } from '../types/colouring';

const DB_NAME = 'kids_colouring_db';
const DB_VERSION = 1;
const STORE_DRAWINGS = 'page_drawings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DRAWINGS)) {
        db.createObjectStore(STORE_DRAWINGS, { keyPath: 'pageId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves drawing actions and optional thumbnail snapshot to IndexedDB
 */
export async function savePageDrawing(
  pageId: string,
  actions: DrawingAction[],
  snapshot?: string,
  completed?: boolean
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAWINGS, 'readwrite');
      const store = tx.objectStore(STORE_DRAWINGS);

      const state: PageDrawingState = {
        pageId,
        actions,
        snapshot,
        completed: completed ?? (actions.length > 0),
        updatedAt: Date.now()
      };

      const request = store.put(state);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB', err);
  }
}

/**
 * Loads saved drawing state for a given pageId
 */
export async function loadPageDrawing(pageId: string): Promise<PageDrawingState | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAWINGS, 'readonly');
      const store = tx.objectStore(STORE_DRAWINGS);
      const request = store.get(pageId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Retrieves all saved page states to display progress badges on the bookshelf
 */
export async function getAllSavedPages(): Promise<Record<string, PageDrawingState>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAWINGS, 'readonly');
      const store = tx.objectStore(STORE_DRAWINGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as PageDrawingState[];
        const map: Record<string, PageDrawingState> = {};
        for (const item of results) {
          map[item.pageId] = item;
        }
        resolve(map);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return {};
  }
}

/**
 * Clears saved drawing for a specific page (Start over)
 */
export async function clearPageDrawing(pageId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAWINGS, 'readwrite');
      const store = tx.objectStore(STORE_DRAWINGS);
      const request = store.delete(pageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete page in IndexedDB', err);
  }
}
