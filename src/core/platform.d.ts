/**
 * Platform detection utilities for conditional native/web functionality
 */
/**
 * Checks if the app is running in a native platform environment (iOS/Android) via Capacitor
 *
 * @returns {boolean} true if running on a native platform, false if running in a browser
 */
export declare const isNativePlatform: () => boolean;
/**
 * Gets the current platform name if running in a native environment
 *
 * @returns {string|null} 'ios', 'android', or null if running in a browser
 */
export declare const getNativePlatform: () => string | null;
/**
 * Checks if the app is running on iOS
 *
 * @returns {boolean} true if running on iOS, false otherwise
 */
export declare const isIOS: () => boolean;
/**
 * Checks if the app is running on Android
 *
 * @returns {boolean} true if running on Android, false otherwise
 */
export declare const isAndroid: () => boolean;
/**
 * Checks if the app is running in a web browser
 *
 * @returns {boolean} true if running in a browser, false if running on a native platform
 */
export declare const isWeb: () => boolean;
