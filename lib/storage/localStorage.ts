/**
 * localStorage utility functions with error handling and type safety
 */

export class LocalStorageManager {
  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get item from localStorage with type safety
   */
  static getItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage with error handling
   */
  static setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage data
   */
  static clear(): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  static getAllKeys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    used: number;
    available: boolean;
    keys: string[];
  } {
    if (!this.isAvailable()) {
      return {
        used: 0,
        available: false,
        keys: []
      };
    }

    try {
      let used = 0;
      const keys = this.getAllKeys();
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      });

      return {
        used,
        available: true,
        keys
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        used: 0,
        available: true,
        keys: []
      };
    }
  }
}

// Export convenience functions
export const getItem = LocalStorageManager.getItem;
export const setItem = LocalStorageManager.setItem;
export const removeItem = LocalStorageManager.removeItem;
export const clearStorage = LocalStorageManager.clear;
export const isStorageAvailable = LocalStorageManager.isAvailable;