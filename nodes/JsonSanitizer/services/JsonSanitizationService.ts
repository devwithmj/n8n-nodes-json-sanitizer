/**
 * Service layer for JSON sanitization business logic
 */

import { SanitizeResult } from '../types';

// Basic JSON repair functionality (no external dependencies)
function basicJsonRepair(input: string): string {
	let repaired = input.trim();

	// If the input is completely invalid and doesn't look like JSON at all,
	// wrap it in quotes to make it a valid JSON string
	if (!repaired.match(/^\s*(\[|\{|")/)) {
		return `"${repaired.replace(/"/g, '\\"')}"`;
	}

	// Remove comments (/* */ and //)
	repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');
	repaired = repaired.replace(/\/\/.*$/gm, '');

	// Replace single quotes with double quotes (basic approach)
	repaired = repaired.replace(/'([^']*)'/g, '"$1"');

	// Add missing commas between properties in objects
	repaired = repaired.replace(/"\s+"/g, '", "'); // Add comma between quoted strings

	// Add quotes around unquoted keys
	repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

	// Remove trailing commas before } or ]
	repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

	return repaired;
}

/**
 * Service responsible for JSON sanitization operations
 */
export class JsonSanitizationService {
	/**
	 * Sanitizes JSON input from various formats
	 * @param input - The input to sanitize (string or object)
	 * @returns Sanitization result
	 * @throws Error if sanitization fails
	 */
	sanitize(input: unknown): SanitizeResult {
		this.validateInput(input);

		// Handle already parsed objects
		if (typeof input === 'object' && input !== null) {
			return this.handleParsedObject(input);
		}

		// Handle string inputs
		if (typeof input === 'string') {
			return this.sanitizeString(input);
		}

		throw new Error('Input must be a string or object');
	}

	/**
	 * Validates input before processing
	 */
	private validateInput(input: unknown): void {
		if (input === null || input === undefined || input === '') {
			throw new Error('Input must be a non-empty string or object');
		}
	}

	/**
	 * Handles already parsed objects
	 */
	private handleParsedObject(input: object): SanitizeResult {
		return {
			cleanedString: JSON.stringify(input, null, 2),
			parsed: input,
			original: input,
			wasAlreadyParsed: true,
		};
	}

	/**
	 * Attempts to repair malformed JSON using advanced repair techniques
	 * @param input - The input string to repair
	 * @returns Sanitization result with repair metadata
	 * @throws Error if repair fails
	 */
	repair(input: unknown): SanitizeResult {
		// Validate that input is a string for repair mode
		if (typeof input !== 'string') {
			throw new Error('Smart Repair mode requires string input');
		}

		this.validateInput(input);

		// For repair mode, we use basic repair functionality
		// This handles common JSON issues without external dependencies

		try {
			const repairedString = basicJsonRepair(input);
			const parsed = JSON.parse(repairedString);

			// Check if repair actually changed anything
			const wasRepaired = repairedString !== input;

			return {
				cleanedString: repairedString,
				parsed,
				original: input,
				wasAlreadyParsed: false,
				wasRepaired,
			};
		} catch (repairError) {
			// If basic repair fails, try normal sanitization as fallback
			try {
				return this.sanitizeString(input);
			} catch (sanitizeError) {
				// If both fail, throw the repair error
				throw new Error(
					`Failed to repair JSON: ${repairError.message}\n\nOriginal sanitization error: ${sanitizeError.message}`
				);
			}
		}
	}
	/**
	 * Sanitizes string input through multiple cleaning steps
	 */
	private sanitizeString(input: string): SanitizeResult {
		let cleaned = input;

		// Apply cleaning steps
		cleaned = this.removeBOM(cleaned);
		cleaned = this.trimWhitespace(cleaned);
		cleaned = this.removeMarkdownFences(cleaned);
		cleaned = this.handleDoublyEscapedJSON(cleaned);
		cleaned = this.removeTrailingCommas(cleaned);
		cleaned = this.removeComments(cleaned);
		cleaned = this.normalizeLineEndings(cleaned);
		cleaned = this.trimWhitespace(cleaned);

		// Parse and validate
		const parsed = this.parseJSON(cleaned);

		return {
			cleanedString: cleaned,
			parsed,
			original: input,
			wasAlreadyParsed: false,
		};
	}

	private removeBOM(input: string): string {
		return input.charCodeAt(0) === 0xFEFF ? input.slice(1) : input;
	}

	private trimWhitespace(input: string): string {
		return input.trim();
	}

	private removeMarkdownFences(input: string): string {
		return input
			.replace(/^```\s*json\s*\n?/i, '')
			.replace(/^```\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim();
	}

	private handleDoublyEscapedJSON(input: string): string {
		if (!input.startsWith('"')) return input;

		try {
			const parsed = JSON.parse(input);
			if (typeof parsed === 'string') {
				return parsed
					.replace(/\\"/g, '"')
					.replace(/\\n/g, '\n')
					.replace(/\\r/g, '\r')
					.replace(/\\t/g, '\t')
					.replace(/\\\\/g, '\\')
					.trim();
			}
		} catch {
			// Not doubly-escaped, continue
		}

		return input;
	}

	private removeTrailingCommas(input: string): string {
		return input.replace(/,(\s*[}\]])/g, '$1');
	}

	private removeComments(input: string): string {
		return input
			.replace(/\/\*[\s\S]*?\*\//g, '')
			.replace(/\/\/.*/g, '');
	}

	private normalizeLineEndings(input: string): string {
		return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	}

	private parseJSON(input: string): unknown {
		try {
			return JSON.parse(input);
		} catch (error) {
			const preview = input.substring(0, 200);
			throw new Error(
				`Failed to parse JSON after sanitization: ${error.message}\n\nCleaned string preview: ${preview}...`
			);
		}
	}
}