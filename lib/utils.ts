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

// Safely convert value to number for calculations
export function safeNumber(value: any, fallback: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

// Format number with safe conversion
export function formatNumber(value: any, decimals: number = 2): string {
  return safeNumber(value).toFixed(decimals);
}

// Safely format date with fallback
export function formatDate(date: any, fallback: string = 'N/A'): string {
  if (!date) return fallback;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    return dateObj.toLocaleDateString();
  } catch (error) {
    return fallback;
  }
}

// Check if a date is valid
export function isValidDate(date: any): boolean {
  if (!date) return false;
  try {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  } catch (error) {
    return false;
  }
}

// Format chart label dates safely
export function formatChartDate(monthKey: string, format: 'short' | 'long' = 'short'): string {
  try {
    const [year, month] = monthKey.split('-');
    if (!year || !month) return monthKey;
    
    const date = new Date(parseInt(year), parseInt(month) - 1);
    if (isNaN(date.getTime())) return monthKey;
    
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  } catch (error) {
    return monthKey;
  }
}
