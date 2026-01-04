/**
 * Type definitions for JSON Sanitizer node
 */

import { INodeExecutionData } from 'n8n-workflow';

/**
 * Result of JSON sanitization operation
 */
export interface SanitizeResult {
	cleanedString: string;
	parsed: unknown;
	original: unknown;
	wasAlreadyParsed: boolean;
}

/**
 * Node configuration parameters
 */
export interface NodeParameters {
	inputField: string;
	outputMode: 'parsed' | 'string' | 'both';
	outputField: string;
	keepOriginal: boolean;
	errorHandling: 'stop' | 'continue';
}

/**
 * Processing context for a single item
 */
export interface ProcessingContext {
	item: INodeExecutionData;
	itemIndex: number;
	parameters: NodeParameters;
}

/**
 * Result of processing a single item
 */
export interface ProcessingResult {
	success: boolean;
	data?: INodeExecutionData;
	error?: {
		message: string;
		itemIndex: number;
	};
}

/**
 * Output modes for the sanitized JSON
 */
export type OutputMode = 'parsed' | 'string' | 'both';

/**
 * Error handling modes
 */
export type ErrorHandlingMode = 'stop' | 'continue';