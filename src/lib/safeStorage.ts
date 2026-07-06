/**
 * SafeStorage utility to handle storage in strict environments
 * (like incognito/secret mode, cross-origin iframes, and privacy sandboxes).
 * 
 * Automatically detects storage restrictions and falls back gracefully to
 * sessionStorage or an in-memory dictionary.
 */

class SafeStorage {
  private memoryStore: Record<string, string> = {};
  private preferredType: 'localStorage' | 'sessionStorage' = 'localStorage';

  constructor() {
    this.detectStorageSupport();
  }

  private detectStorageSupport() {
    const testKey = '__pino_test__';
    
    // 1. Try localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        this.preferredType = 'localStorage';
        return;
      }
    } catch (e) {
      console.warn('⚠️ localStorage is restricted or disabled (common in Incognito/Secret mode). Trying sessionStorage...');
    }

    // 2. Try sessionStorage as fallback
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(testKey, '1');
        window.sessionStorage.removeItem(testKey);
        this.preferredType = 'sessionStorage';
        console.info('ℹ️ sessionStorage is active and will be used as the primary storage.');
        return;
      }
    } catch (e) {
      console.error('⚠️ sessionStorage is also restricted. Falling back to safe In-Memory storage.');
    }

    // 3. Fallback to memory
    this.preferredType = 'sessionStorage'; // Default API usage will route to memory fallback
  }

  private isAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      if (!storage) return false;
      const testKey = '__pino_write_test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  public getItem(key: string): string | null {
    // Check preferred storage first
    if (this.preferredType === 'localStorage' && this.isAvailable('localStorage')) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {}
    }

    if (this.isAvailable('sessionStorage')) {
      try {
        return window.sessionStorage.getItem(key);
      } catch (e) {}
    }

    // Return from in-memory fallback
    return this.memoryStore[key] || null;
  }

  public setItem(key: string, value: string): void {
    let success = false;

    // Try storing in preferred storage
    if (this.preferredType === 'localStorage' && this.isAvailable('localStorage')) {
      try {
        window.localStorage.setItem(key, value);
        success = true;
      } catch (e) {}
    }

    // Fallback to sessionStorage
    if (!success && this.isAvailable('sessionStorage')) {
      try {
        window.sessionStorage.setItem(key, value);
        success = true;
      } catch (e) {}
    }

    // Always keep in-memory sync as absolute backup
    this.memoryStore[key] = value;
  }

  public removeItem(key: string): void {
    if (this.isAvailable('localStorage')) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
    }

    if (this.isAvailable('sessionStorage')) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (e) {}
    }

    delete this.memoryStore[key];
  }

  public clear(): void {
    if (this.isAvailable('localStorage')) {
      try {
        window.localStorage.clear();
      } catch (e) {}
    }
    if (this.isAvailable('sessionStorage')) {
      try {
        window.sessionStorage.clear();
      } catch (e) {}
    }
    this.memoryStore = {};
  }
}

export const safeStorage = new SafeStorage();
