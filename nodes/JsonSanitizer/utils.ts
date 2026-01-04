/**
 * Utility functions for JSON sanitization
 */

interface SanitizeResult {
	cleanedString: string;
	parsed: unknown;
	original: unknown;
	wasAlreadyParsed: boolean;
}

/**
 * Core sanitization function that handles various JSON input formats
 * @param input - The input JSON string or object to sanitize
 * @returns Object containing cleaned string, parsed object, and metadata
 * @throws Error if input is invalid or cannot be parsed
 */
export function sanitizeJSON(input: unknown): SanitizeResult {
	if (!input) {
		throw new Error('Input must be a non-empty string or object');
	}

	// Check if input is already a parsed object
	if (typeof input === 'object') {
		return {
			cleanedString: JSON.stringify(input, null, 2),
			parsed: input,
			original: input,
			wasAlreadyParsed: true,
		};
	}

	// Must be a string if we got here
	if (typeof input !== 'string') {
		throw new Error('Input must be a string or object');
	}

	let cleaned = input;

	// Step 1: Remove BOM (Byte Order Mark) if present
	if (cleaned.charCodeAt(0) === 0xFEFF) {
		cleaned = cleaned.slice(1);
	}

	// Step 2: Trim whitespace
	cleaned = cleaned.trim();

	// Step 3: Remove markdown code fences
	cleaned = cleaned.replace(/^```\s*json\s*\n?/i, '');
	cleaned = cleaned.replace(/^```\s*\n?/i, '');
	cleaned = cleaned.replace(/\n?```\s*$/i, '');
	cleaned = cleaned.trim();

	// Step 4: Handle doubly-escaped JSON
	if (cleaned.startsWith('"')) {
		try {
			const parsed = JSON.parse(cleaned);
			if (typeof parsed === 'string') {
				cleaned = parsed;
				// Unescape the inner string
				cleaned = cleaned
					.replace(/\\"/g, '"')
					.replace(/\\n/g, '\n')
					.replace(/\\r/g, '\r')
					.replace(/\\t/g, '\t')
					.replace(/\\\\/g, '\\');
			}
		} catch {
			// Not doubly-escaped, continue
		}
		cleaned = cleaned.trim();
	}

	// Step 5: Remove trailing commas
	cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

	// Step 6: Remove JavaScript-style comments
	cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
	cleaned = cleaned.replace(/\/\/.*/g, '');

	// Step 7: Normalize line endings
	cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

	// Step 8: Final trim
	cleaned = cleaned.trim();

	// Step 9: Validate and parse
	let parsed;
	try {
		parsed = JSON.parse(cleaned);
	} catch (error) {
		throw new Error(
			`Failed to parse JSON after sanitization: ${error.message}\n\nCleaned string preview: ${cleaned.substring(0, 200)}...`
		);
	}

	return {
		cleanedString: cleaned,
		parsed: parsed,
		original: input,
		wasAlreadyParsed: false,
	};
}