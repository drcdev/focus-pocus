import { randomUUID } from 'crypto';

/**
 * Generate a UUID for new items
 */
export function generateId(): string {
  return randomUUID();
}