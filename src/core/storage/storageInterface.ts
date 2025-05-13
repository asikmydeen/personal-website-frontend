/**
 * Storage interface for abstracting storage operations across platforms
 * Provides a consistent API for both web and native mobile environments
 */
export interface Storage {
  /**
   * Retrieves a value from storage by key
   * @param key The key to retrieve
   * @returns The stored value, or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Stores a value in storage
   * @param key The key to store the value under
   * @param value The value to store
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Removes a value from storage
   * @param key The key to remove
   */
  remove(key: string): Promise<void>;
}

/**
 * Web implementation of Storage interface using localStorage
 */
export class WebStorage implements Storage {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

/**
 * Native implementation of Storage interface
 * This is a placeholder that will be implemented with Capacitor Preferences plugin
 */
export class NativeStorage implements Storage {
  async get(_key: string): Promise<string | null> { // Prefixed key
    // TODO: Implement using Capacitor Preferences plugin
    console.warn('NativeStorage.get not yet implemented');
    return null;
  }

  async set(_key: string, _value: string): Promise<void> { // Prefixed key and value
    // TODO: Implement using Capacitor Preferences plugin
    console.warn('NativeStorage.set not yet implemented');
  }

  async remove(_key: string): Promise<void> { // Prefixed key
    // TODO: Implement using Capacitor Preferences plugin
    console.warn('NativeStorage.remove not yet implemented');
  }
}

/**
 * Factory function to get the appropriate storage implementation
 * based on the current platform
 */
export function getStorage(): Storage {
  // This will be enhanced later with proper platform detection
  const isNative = false; // Placeholder for platform detection
  return isNative ? new NativeStorage() : new WebStorage();
}