/**
 * Web implementation of Storage interface using localStorage
 */
export class WebStorage {
    async get(key) {
        return localStorage.getItem(key);
    }
    async set(key, value) {
        localStorage.setItem(key, value);
    }
    async remove(key) {
        localStorage.removeItem(key);
    }
}
/**
 * Native implementation of Storage interface
 * This is a placeholder that will be implemented with Capacitor Preferences plugin
 */
export class NativeStorage {
    async get(_key) {
        // TODO: Implement using Capacitor Preferences plugin
        console.warn('NativeStorage.get not yet implemented');
        return null;
    }
    async set(_key, _value) {
        // TODO: Implement using Capacitor Preferences plugin
        console.warn('NativeStorage.set not yet implemented');
    }
    async remove(_key) {
        // TODO: Implement using Capacitor Preferences plugin
        console.warn('NativeStorage.remove not yet implemented');
    }
}
/**
 * Factory function to get the appropriate storage implementation
 * based on the current platform
 */
export function getStorage() {
    // This will be enhanced later with proper platform detection
    const isNative = false; // Placeholder for platform detection
    return isNative ? new NativeStorage() : new WebStorage();
}
