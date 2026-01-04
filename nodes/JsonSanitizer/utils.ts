/**
 * Utility functions for JSON sanitization (legacy compatibility)
 */

import { JsonSanitizationService } from './services/JsonSanitizationService';
import { SanitizeResult } from './types';

// Create a singleton instance for backward compatibility
const sanitizationService = new JsonSanitizationService();

/**
 * Legacy function for backward compatibility
 * @deprecated Use JsonSanitizationService directly for new code
 */
export function sanitizeJSON(input: unknown): SanitizeResult {
	return sanitizationService.sanitize(input);
}

/**
 * Attempts to repair malformed JSON using advanced repair techniques
 * @param input - The input string to repair
 * @returns Sanitization result with repair metadata
 * @deprecated Use JsonSanitizationService.repair() directly for new code
 */
export function repairJSON(input: unknown): SanitizeResult {
	return sanitizationService.repair(input);
}