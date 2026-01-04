/**
 * Service layer for JSON sanitization business logic
 */

import { SanitizeResult } from '../types';

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