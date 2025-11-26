/**
 * Utility functions for test-app
 * 
 * Contains helper functions used across the application.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using clsx and tailwind-merge
 * 
 * This utility combines the power of clsx for conditional classes
 * with tailwind-merge to properly handle Tailwind CSS class conflicts.
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

