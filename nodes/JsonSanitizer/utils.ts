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