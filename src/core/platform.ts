import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for conditional native/web functionality
 */

/**
 * Checks if the app is running in a native platform environment (iOS/Android) via Capacitor
 *
 * @returns {boolean} true if running on a native platform, false if running in a browser
 */
export const isNativePlatform = (): boolean => {
  // Check if Capacitor is available and is the native platform
  return Capacitor.isNativePlatform();
};

/**
 * Gets the current platform name if running in a native environment
 *
 * @returns {string|null} 'ios', 'android', or null if running in a browser
 */
export const getNativePlatform = (): string | null => {
  if (!isNativePlatform()) {
    return null;
  }
  // Access Capacitor's platform information
  return Capacitor.getPlatform()?.toLowerCase() || null;
};

/**
 * Checks if the app is running on iOS
 *
 * @returns {boolean} true if running on iOS, false otherwise
 */
export const isIOS = (): boolean => {
  // First check if we're on native iOS via Capacitor
  if (getNativePlatform() === 'ios') {
    return true;
  }

  // Simple fallback for iOS detection in browser testing
  if (typeof navigator !== 'undefined') {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  return false;
};

/**
 * Checks if the app is running on Android
 *
 * @returns {boolean} true if running on Android, false otherwise
 */
export const isAndroid = (): boolean => {
  return getNativePlatform() === 'android';
};

/**
 * Checks if the app is running in a web browser
 *
 * @returns {boolean} true if running in a browser, false if running on a native platform
 */
export const isWeb = (): boolean => {
  return !isNativePlatform();
};