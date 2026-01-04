/**
 * Node configuration and properties for JSON Sanitizer node
 * Defines the user interface and parameter structure
 */

import { INodeProperties } from 'n8n-workflow';

/**
 * Node properties configuration with comprehensive validation and descriptions
 */
export const nodeProperties: INodeProperties[] = [
	{
		displayName: 'Input Field',
		name: 'inputField',
		type: 'string',
		default: 'json',
		required: true,
		description: 'The field containing the JSON string or object to sanitize. Supports dot notation for nested fields (e.g., "data.body.content").',
		placeholder: 'e.g., json, data, body.content, response.data',
		noDataExpression: false,
	},
	{
		displayName: 'Output Mode',
		name: 'outputMode',
		type: 'options',
		options: [
			{
				name: 'Parsed Object',
				value: 'parsed',
				description: 'Return only the parsed JSON as a clean object',
			},
			{
				name: 'Cleaned String',
				value: 'string',
				description: 'Return the sanitized JSON as a properly formatted string',
			},
			{
				name: 'Both (with Metadata)',
				value: 'both',
				description: 'Return both parsed object and metadata including original type and processing details',
			},
			{
				name: 'Smart Repair',
				value: 'repair',
				description: 'Attempt to automatically fix malformed JSON using advanced repair techniques',
			},
		],
		default: 'parsed',
		description: 'Choose how the sanitized JSON should be returned. "Smart Repair" is best for malformed or broken JSON.',
	},
	{
		displayName: 'Output Field Name',
		name: 'outputField',
		type: 'string',
		default: 'sanitized',
		required: true,
		description: 'The field name where the sanitized result will be stored in the output',
		placeholder: 'e.g., sanitized, cleanJson, result',
		noDataExpression: false,
	},
	{
		displayName: 'Keep Original Data',
		name: 'keepOriginal',
		type: 'boolean',
		default: false,
		description: 'Whether to preserve all original input fields in the output alongside the sanitized result',
	},
	{
		displayName: 'Error Handling',
		name: 'errorHandling',
		type: 'options',
		options: [
			{
				name: 'Stop Workflow',
				value: 'stop',
				description: 'Stop the entire workflow execution if sanitization fails for any item',
			},
			{
				name: 'Continue with Error Info',
				value: 'continue',
				description: 'Continue processing and include error information in the output for failed items',
			},
		],
		default: 'stop',
		description: 'How to handle cases where JSON sanitization fails. "Continue" mode adds error details to output.',
	},
];