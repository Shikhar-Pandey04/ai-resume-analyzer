/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - The size in bytes
 * @returns A formatted string like "1.5 MB", "500 KB", etc.
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to combine class names conditionally
 * @param classes - Array of class names or conditional class objects
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const generateUUID = () => crypto.randomUUID();
  
