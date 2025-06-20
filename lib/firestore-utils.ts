/**
 * Firestore Utilities
 * Helper functions for working with Firestore data
 */

/**
 * Remove undefined values from an object to prevent Firestore errors
 * Firestore doesn't accept undefined values, so we need to filter them out
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Convert Firestore timestamps to Date objects
 */
export function convertTimestamps(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(data)) {
    converted[key] = convertTimestamps(value);
  }
  return converted;
}

/**
 * Prepare data for Firestore by cleaning undefined values and handling dates
 */
export function prepareForFirestore<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned = cleanFirestoreData(data);
  
  // Convert Date objects to Firestore-friendly format if needed
  const prepared: any = {};
  for (const [key, value] of Object.entries(cleaned)) {
    if (value instanceof Date) {
      prepared[key] = value; // Firestore handles Date objects natively
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      prepared[key] = prepareForFirestore(value);
    } else {
      prepared[key] = value;
    }
  }
  
  return prepared;
}

/**
 * Type-safe helper for creating Firestore documents with auto-generated IDs
 */
export function createDocumentData<T>(
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  id: string
): T {
  return {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as T;
}

/**
 * Type-safe helper for updating Firestore documents
 */
export function createUpdateData<T>(
  updates: Partial<Omit<T, 'id' | 'createdAt'>>,
): Partial<T> & { updatedAt: Date } {
  return {
    ...updates,
    updatedAt: new Date(),
  } as Partial<T> & { updatedAt: Date };
}

/**
 * Utility functions for Firestore operations
 */

/**
 * Safely convert Firestore timestamp or Date to Date object
 */
export function toDate(value: any): Date {
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date(0); // fallback
}

/**
 * Sort array by date field in descending order (newest first)
 */
export function sortByDateDesc<T>(array: T[], dateField: keyof T): T[] {
  return array.sort((a, b) => {
    const aTime = toDate(a[dateField]);
    const bTime = toDate(b[dateField]);
    return bTime.getTime() - aTime.getTime();
  });
}

/**
 * Sort array by date field in ascending order (oldest first)
 */
export function sortByDateAsc<T>(array: T[], dateField: keyof T): T[] {
  return array.sort((a, b) => {
    const aTime = toDate(a[dateField]);
    const bTime = toDate(b[dateField]);
    return aTime.getTime() - bTime.getTime();
  });
}
