import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { sanitizeJSON } from './utils';

/**
 * N8N node for sanitizing and normalizing JSON data from various input formats
 */
export class JsonSanitizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSON Sanitizer',
		name: 'jsonSanitizer',
		icon: 'fa:code', // eslint-disable-line @n8n/community-nodes/icon-validation
		group: ['transform'],
		version: 1,
		description: 'Sanitize and normalize JSON strings from various formats',
		defaults: {
			name: 'JSON Sanitizer',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Input Field',
				name: 'inputField',
				type: 'string',
				default: 'json',
				required: true,
				description: 'The field containing the JSON string or object to sanitize',
				placeholder: 'e.g., data or body.content',
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
		],
		usableAsTool: true,
	};

	/**
	 * Execute the JSON Sanitizer node
	 * @param this - N8N execution context
	 * @returns Processed data items
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Process each item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			// Get parameters (can be expressions per item)
			const inputField = this.getNodeParameter('inputField', itemIndex) as string;
			const outputMode = this.getNodeParameter('outputMode', itemIndex) as string;
			const outputField = this.getNodeParameter('outputField', itemIndex) as string;
			const keepOriginal = this.getNodeParameter('keepOriginal', itemIndex) as boolean;
			const errorHandling = this.getNodeParameter('errorHandling', itemIndex) as string;

			try { // eslint-disable-line @typescript-eslint/no-unused-vars
				
				// Get input value from the specified field
				let jsonInput: unknown = (item.json as Record<string, unknown>)[inputField];

				// If input field uses dot notation (e.g., 'body.content')
				if (inputField.includes('.')) {
					const parts = inputField.split('.');
					let current: unknown = item.json as Record<string, unknown>;
					for (const key of parts) {
						current = (current as Record<string, unknown>)?.[key];
					}
					jsonInput = current;
				}

				if (jsonInput === undefined || jsonInput === null) {
					throw new NodeOperationError(
						this.getNode(),
						`Field '${inputField}' not found in input data`,
						{ itemIndex }
					);
				}

				// Sanitize the JSON
				const result = sanitizeJSON(jsonInput);

				// Prepare output based on mode
				let outputData: unknown;
				switch (outputMode) {
					case 'parsed':
						outputData = result.parsed;
						break;
					case 'string':
						outputData = result.cleanedString;
						break;
					case 'both':
						outputData = {
							parsed: result.parsed,
							cleanedString: result.cleanedString,
							wasAlreadyParsed: result.wasAlreadyParsed,
							originalType: typeof jsonInput,
						};
						break;
				}

				// Build output item
				const newItem: INodeExecutionData = {
					json: keepOriginal ? { ...item.json } : {},
					pairedItem: { item: itemIndex },
				};

				// Add sanitized data to output
				newItem.json[outputField] = outputData as any;

				returnData.push(newItem);

			} catch (error) {
				if (errorHandling === 'stop') {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to sanitize JSON: ${error.message}`,
						{ itemIndex }
					);
				} else {
					// Continue with error info
					const newItem: INodeExecutionData = {
						json: {
							...items[itemIndex].json,
							[outputField]: null,
							error: {
								message: error.message,
								itemIndex,
							},
						},
						pairedItem: { item: itemIndex },
					};
					returnData.push(newItem);
				}
			}
		}

		return [returnData];
	}
}