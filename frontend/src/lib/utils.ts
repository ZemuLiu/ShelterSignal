// frontend/src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Keep your existing cn function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- NEW HELPER FUNCTIONS ---

/**
 * Formats a number as currency (USD).
 * Returns 'N/A' if the value is null or undefined.
 * @param value - The number to format.
 * @param maximumFractionDigits - The maximum number of decimal places (default: 0).
 * @returns Formatted currency string or 'N/A'.
 */
export const formatCurrency = (
    value?: number | null,
    maximumFractionDigits: number = 0 // Default to 0 decimal places for cleaner display
): string => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  try {
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: maximumFractionDigits
    });
  } catch (error) {
    console.error("Error formatting currency:", error);
    return 'N/A'; // Return N/A on formatting error
  }
};

/**
 * Formats a number with commas as thousands separators.
 * Returns 'N/A' if the value is null or undefined.
 * @param value - The number to format.
 * @returns Formatted number string or 'N/A'.
 */
export const formatNumber = (value?: number | null): string => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  try {
    return value.toLocaleString('en-US');
  } catch (error) {
    console.error("Error formatting number:", error);
    return 'N/A';
  }
};

/**
 * Formats a date string (e.g., "YYYY-MM-DD") into a more readable format (e.g., "Jan 1, 2023").
 * Returns 'N/A' if the date string is null, undefined, or invalid.
 * @param dateString - The date string to format.
 * @returns Formatted date string or 'N/A'.
 */
export const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        // Attempt to create a date object. Add time component for robustness if needed.
        const date = new Date(dateString);
        // Check if the date is valid after parsing
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        // Adjust for potential timezone issues by using UTC methods if necessary,
        // but for simple display, local time is often acceptable.
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short', // 'short' gives "Jan", "Feb", etc.
            day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date'; // Return specific error message
    }
}

/**
 * Returns Tailwind CSS classes for styling based on market trend.
 * @param trend - The market trend string ('Increasing', 'Decreasing', 'Stable', etc.).
 * @returns Tailwind CSS class string.
 */
export const getTrendColor = (trend?: string | null): string => {
    switch (trend?.toLowerCase()) { // Use lowercase for case-insensitivity
        case 'increasing':
            return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
        case 'decreasing':
            return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
        case 'stable':
            return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600';
        default: // Handle null, undefined, 'Unknown', 'Error' etc.
            return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'; // Default/Unknown style
    }
};