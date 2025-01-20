"use client";

class StorageService {
  static getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  static setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error("Error setting localStorage", e);
    }
  }

  static removeItem(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  }
}

export default StorageService;
