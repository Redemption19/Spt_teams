/**
 * Auto-resize textarea utility functions
 */
import React from 'react';

/**
 * Auto-resize a textarea element based on its content
 * @param textarea - The textarea element to resize
 * @param minHeight - Minimum height in pixels (default: 100)
 * @param maxHeight - Maximum height in pixels (default: 500)
 */
export const autoResizeTextarea = (
  textarea: HTMLTextAreaElement, 
  minHeight: number = 100, 
  maxHeight: number = 500
) => {
  if (!textarea) return;
  
  // Reset height to auto to get accurate scrollHeight
  textarea.style.height = 'auto';
  
  // Calculate new height based on content
  const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
  
  // Set the new height
  textarea.style.height = `${newHeight}px`;
  
  // Add or remove scrollbar based on content
  if (textarea.scrollHeight > maxHeight) {
    textarea.style.overflowY = 'auto';
  } else {
    textarea.style.overflowY = 'hidden';
  }
};

/**
 * Create an auto-resize handler for textarea onChange events
 * @param minHeight - Minimum height in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Event handler function
 */
export const createAutoResizeHandler = (minHeight = 100, maxHeight = 500) => {
  return (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    autoResizeTextarea(event.target, minHeight, maxHeight);
  };
};

/**
 * Setup auto-resize for a textarea element with proper event listeners
 * @param textarea - The textarea element
 * @param minHeight - Minimum height in pixels
 * @param maxHeight - Maximum height in pixels
 */
export const setupAutoResize = (
  textarea: HTMLTextAreaElement, 
  minHeight = 100, 
  maxHeight = 500
) => {
  if (!textarea) return;
  
  // Initial resize
  autoResizeTextarea(textarea, minHeight, maxHeight);
  
  // Set up event listeners
  const handleResize = () => autoResizeTextarea(textarea, minHeight, maxHeight);
  
  textarea.addEventListener('input', handleResize);
  textarea.addEventListener('paste', () => {
    // Small delay to allow paste content to be processed
    setTimeout(handleResize, 10);
  });
  
  // Return cleanup function
  return () => {
    textarea.removeEventListener('input', handleResize);
  };
};

/**
 * React hook for auto-resizing textareas
 * @param ref - React ref to the textarea element
 * @param value - Current textarea value (to trigger resize on value changes)
 * @param minHeight - Minimum height in pixels
 * @param maxHeight - Maximum height in pixels
 */
export const useAutoResize = (
  ref: React.RefObject<HTMLTextAreaElement>,
  value: string,
  minHeight = 100,
  maxHeight = 500
) => {
  React.useEffect(() => {
    if (ref.current) {
      autoResizeTextarea(ref.current, minHeight, maxHeight);
    }
  }, [ref, value, minHeight, maxHeight]);
  
  React.useEffect(() => {
    if (ref.current) {
      return setupAutoResize(ref.current, minHeight, maxHeight);
    }
  }, [ref, minHeight, maxHeight]);
}; 