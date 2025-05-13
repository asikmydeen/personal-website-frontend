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
export declare class WebStorage implements Storage {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}
/**
 * Native implementation of Storage interface
 * This is a placeholder that will be implemented with Capacitor Preferences plugin
 */
export declare class NativeStorage implements Storage {
    get(_key: string): Promise<string | null>;
    set(_key: string, _value: string): Promise<void>;
    remove(_key: string): Promise<void>;
}
/**
 * Factory function to get the appropriate storage implementation
 * based on the current platform
 */
export declare function getStorage(): Storage;
