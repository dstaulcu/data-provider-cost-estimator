/**
 * Storage Manager
 * Provides app-specific localStorage with namespacing to avoid collisions
 */

const APP_PREFIX = 'cost-estimator';

export class StorageManager {
  /**
   * Get a namespaced key
   */
  static getKey(key) {
    return `${APP_PREFIX}:${key}`;
  }

  /**
   * Get item from localStorage with app prefix
   */
  static getItem(key) {
    try {
      const value = localStorage.getItem(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage with app prefix
   */
  static setItem(key, value) {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage with app prefix
   */
  static removeItem(key) {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all app-specific items from localStorage
   */
  static clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${APP_PREFIX}:`)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all app-specific keys
   */
  static getAllKeys() {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(`${APP_PREFIX}:`))
        .map(key => key.substring(`${APP_PREFIX}:`.length));
    } catch (error) {
      console.error('Error reading localStorage keys:', error);
      return [];
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}
