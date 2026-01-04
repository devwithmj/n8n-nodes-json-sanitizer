/**
 * Service layer for JSON sanitization business logic
 */

import { jsonrepair } from 'jsonrepair';
import { SanitizeResult } from '../types';

/**
 * Basic JSON repair functionality for cases where jsonrepair might not be available
 * @param input - The input string to repair
 * @returns Repaired JSON string
 */
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
	 * @param input - The input to validate
	 * @throws Error if input is null, undefined, or empty string
	 */
	private validateInput(input: unknown): void {
		if (input === null || input === undefined || input === '') {
			throw new Error('Input must be a non-empty string or object');
		}
	}

	/**
	 * Handles already parsed objects by stringifying them
	 * @param input - The parsed object to handle
	 * @returns Sanitization result with parsed object data
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

		// Use jsonrepair for advanced repair
		try {
			const repairedString = jsonrepair(input);
			const parsed = JSON.parse(repairedString);

			// Check if repair actually changed anything
			const wasRepaired = repairedString !== input.trim();

			return {
				cleanedString: repairedString,
				parsed,
				original: input,
				wasAlreadyParsed: false,
				wasRepaired,
			};
		} catch (jsonRepairError) {
			// If jsonrepair fails, try basic repair as fallback
			try {
				const basicRepairedString = basicJsonRepair(input);
				const parsed = JSON.parse(basicRepairedString);

				return {
					cleanedString: basicRepairedString,
					parsed,
					original: input,
					wasAlreadyParsed: false,
					wasRepaired: true,
				};
			} catch (basicError) {
				// If both methods fail, provide comprehensive error
				throw new Error(
					`Failed to repair JSON with all methods:\n` +
					`- JSON Repair error: ${(jsonRepairError as Error).message}\n` +
					`- Basic repair error: ${(basicError as Error).message}`
				);
			}
		}
	}
	/**
	 * Sanitizes string input through multiple cleaning steps
	 * @param input - The string to sanitize
	 * @returns Sanitization result with cleaned data
	 * @throws Error if sanitization fails
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

	/**
	 * Removes Byte Order Mark (BOM) from the beginning of input
	 * @param input - The input string
	 * @returns String without BOM
	 */
	private removeBOM(input: string): string {
		return input.charCodeAt(0) === 0xFEFF ? input.slice(1) : input;
	}

	/**
	 * Trims whitespace from beginning and end of input
	 * @param input - The input string
	 * @returns Trimmed string
	 */
	private trimWhitespace(input: string): string {
		return input.trim();
	}

	/**
	 * Removes markdown code fences (```json and ```)
	 * @param input - The input string
	 * @returns String without markdown fences
	 */
	private removeMarkdownFences(input: string): string {
		return input
			.replace(/^```\s*json\s*\n?/i, '')
			.replace(/^```\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim();
	}

	/**
	 * Handles doubly-escaped JSON strings by unescaping them
	 * @param input - The input string that might be doubly-escaped
	 * @returns Unescaped string or original input if not doubly-escaped
	 */
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

	/**
	 * Removes trailing commas before closing brackets or braces
	 * @param input - The input string
	 * @returns String without trailing commas
	 */
	private removeTrailingCommas(input: string): string {
		return input.replace(/,(\s*[}\]])/g, '$1');
	}

	/**
	 * Removes both single-line and multi-line comments from JSON
	 * @param input - The input string
	 * @returns String without comments
	 */
	private removeComments(input: string): string {
		// Remove block comments first
		let result = input.replace(/\/\*[\s\S]*?\*\//g, '');
		
		// For line comments, be more careful to avoid removing URLs
		// Split by lines and process each line
		return result.replace(/^(.*?)\/\/.*$/gm, (match, beforeComment) => {
			// Only remove the comment if // appears outside of quoted strings
			// Simple heuristic: count unescaped quotes before //
			const quotesBeforeComment = (beforeComment.match(/(?<!\\)"/g) || []).length;
			// If even number of quotes, we're outside a string, so remove comment
			if (quotesBeforeComment % 2 === 0) {
				return beforeComment;
			}
			// If odd number of quotes, we're inside a string, keep the line as-is
			return match;
		});
	}

	/**
	 * Normalizes line endings to Unix-style (\n)
	 * @param input - The input string
	 * @returns String with normalized line endings
	 */
	private normalizeLineEndings(input: string): string {
		return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	}

	/**
	 * Escapes control characters within JSON string values
	 * @param input - The input string
	 * @returns String with escaped control characters
	 */
	private escapeControlCharacters(input: string): string {
		// Only escape the most common problematic control characters
		// that break JSON parsing: unescaped newlines and tabs
		return input
			.replace(/\n/g, '\\n')
			.replace(/\r/g, '\\r')
			.replace(/\t/g, '\\t');
	}

	/**
	 * Parses JSON string with enhanced error reporting
	 * @param input - The JSON string to parse
	 * @returns Parsed object
	 * @throws Error with preview if parsing fails
	 */
	private parseJSON(input: string): unknown {
		try {
			return JSON.parse(input);
		} catch (error) {
			// Try escaping control characters first if not already done
			try {
				const controlEscaped = this.escapeControlCharacters(input);
				if (controlEscaped !== input) {
					return JSON.parse(controlEscaped);
				}
			} catch (controlError) {
				// Continue to other fallbacks
			}

			// Try jsonrepair as fallback
			try {
				const repaired = jsonrepair(input);
				return JSON.parse(repaired);
			} catch (repairError) {
				// Try basic repair as final fallback
				try {
					const basicRepaired = basicJsonRepair(input);
					return JSON.parse(basicRepaired);
				} catch (basicError) {
					const preview = input.length > 200 ? input.substring(0, 200) + '...' : input;
					throw new Error(
						`Failed to parse JSON after sanitization: ${(error as Error).message}\n\n` +
						`Cleaned string preview: ${preview}\n\n` +
						`Suggestion: Try using "Smart Repair" output mode for malformed JSON, or check if your input contains unescaped special characters.`
					);
				}
			}
		}
	}
}