import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format timestamp for display
export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return '';
  
  let date: Date;
  
  // Handle Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } 
  // Handle regular Date object
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // Handle string or number
  else {
    date = new Date(timestamp);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Convert Firestore timestamps safely
export function convertTimestamps(obj: any): any {
  if (!obj) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  
  // Handle objects
  if (typeof obj === 'object' && obj !== null) {
    const converted: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if this looks like a Firestore timestamp
      if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        try {
          converted[key] = value.toDate();
        } catch (error) {
          console.warn(`Failed to convert timestamp for key ${key}:`, error);
          converted[key] = value;
        }
      } else {
        converted[key] = convertTimestamps(value);
      }
    }
    
    return converted;
  }
  
  return obj;
}

// Debounce function for search and auto-save
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}
