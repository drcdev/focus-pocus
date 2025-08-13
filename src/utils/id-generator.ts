import { randomUUID } from 'crypto';

/**
 * Generate a UUID for new items
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Generate a short ID for temporary or cache keys
 */
export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Validate that a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Generate a cache key for OmniFocus items
 */
export function generateCacheKey(type: string, id?: string, suffix?: string): string {
  const parts = [type];
  if (id) parts.push(id);
  if (suffix) parts.push(suffix);
  return parts.join(':');
}