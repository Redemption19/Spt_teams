/**
 * Safe date formatting utilities for handling Firestore timestamps and Date objects
 */

/**
 * Safely formats a date that could be a Firestore timestamp or Date object
 * @param date - The date value (could be Firestore timestamp, Date, or string)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or fallback message
 */
export function safeFormatDate(
  date: any,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'Date not available'
): string {
  if (!date) return fallback;
  
  try {
    // Handle Firestore timestamp with toDate() method
    const dateObj = date.toDate?.() || date;
    
    // Ensure we have a valid Date object
    const finalDate = new Date(dateObj);
    
    // Check if the date is valid
    if (isNaN(finalDate.getTime())) {
      return fallback;
    }
    
    // Format the date
    return finalDate.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return fallback;
  }
}

/**
 * Safely formats a date with time
 * @param date - The date value (could be Firestore timestamp, Date, or string)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date and time string or fallback message
 */
export function safeFormatDateTime(
  date: any,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'Date not available'
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return safeFormatDate(date, defaultOptions, fallback);
}

/**
 * Safely formats a date in a relative format (e.g., "2 days ago")
 * @param date - The date value (could be Firestore timestamp, Date, or string)
 * @param fallback - Fallback message if date is invalid
 * @returns Relative date string or fallback message
 */
export function safeFormatRelativeDate(
  date: any,
  fallback: string = 'Date not available'
): string {
  if (!date) return fallback;
  
  try {
    // Handle Firestore timestamp with toDate() method
    const dateObj = date.toDate?.() || date;
    
    // Ensure we have a valid Date object
    const finalDate = new Date(dateObj);
    
    // Check if the date is valid
    if (isNaN(finalDate.getTime())) {
      return fallback;
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - finalDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  } catch (error) {
    console.warn('Error formatting relative date:', date, error);
    return fallback;
  }
}