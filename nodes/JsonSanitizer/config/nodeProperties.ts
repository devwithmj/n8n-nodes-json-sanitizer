/**
 * Node configuration and properties
 */

import { INodeProperties } from 'n8n-workflow';

/**
 * Node properties configuration
 */
export const nodeProperties: INodeProperties[] = [
	{
		displayName: 'Input Field',
		name: 'inputField',
		type: 'string',
		default: 'json',
		required: true,
		description: 'The field containing the JSON string or object to sanitize',
		placeholder: 'e.g., data or body.content',
		noDataExpression: true,
	},
	{
		displayName: 'Output Mode',
		name: 'outputMode',
		type: 'options',
		options: [
			{
				name: 'Parsed Object',
				value: 'parsed',
				description: 'Output the parsed JSON as an object',
			},
			{
				name: 'Cleaned String',
				value: 'string',
				description: 'Output the sanitized JSON as a string',
			},
			{
				name: 'Both (Detailed)',
				value: 'both',
				description: 'Output both parsed object and metadata',
			},
			{
				name: 'Smart Repair',
				value: 'repair',
				description: 'Attempt to automatically fix malformed JSON',
			},
		],
		default: 'parsed',
		description: 'How to output the sanitized JSON',
	},
	{
		displayName: 'Output Field Name',
		name: 'outputField',
		type: 'string',
		default: 'sanitized',
		required: true,
		description: 'The field name to store the sanitized result',
		noDataExpression: true,
	},
	{
		displayName: 'Keep Original',
		name: 'keepOriginal',
		type: 'boolean',
		default: false,
		description: 'Whether to keep the original input field in the output',
	},
	{
		displayName: 'Error Handling',
		name: 'errorHandling',
		type: 'options',
		options: [
			{
				name: 'Stop Workflow',
				value: 'stop',
				description: 'Stop the workflow if sanitization fails',
			},
			{
				name: 'Continue with Error Info',
				value: 'continue',
				description: 'Continue and add error information to output',
			},
		],
		default: 'stop',
		description: 'How to handle sanitization errors',
	},
];