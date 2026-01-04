/**
 * Additional type definitions for enhanced type safety
 */

/**
 * Comprehensive error information for failed processing
 */
export interface ProcessingError {
	message: string;
	itemIndex: number;
	type: 'JSON_SANITIZATION_ERROR' | 'FIELD_EXTRACTION_ERROR' | 'VALIDATION_ERROR';
	originalInput?: unknown;
	fieldPath?: string;
}

/**
 * Enhanced result with error information
 */
export interface EnhancedProcessingResult {
	success: boolean;
	data?: INodeExecutionData;
	error?: ProcessingError;
}

/**
 * JSON repair metadata for repair mode
 */
export interface RepairMetadata {
	wasRepaired: boolean;
	repairMethod: 'jsonrepair' | 'basic' | 'sanitization' | 'none';
	originalLength: number;
	repairedLength: number;
	errorsFound: string[];
}

import { INodeExecutionData } from 'n8n-workflow';