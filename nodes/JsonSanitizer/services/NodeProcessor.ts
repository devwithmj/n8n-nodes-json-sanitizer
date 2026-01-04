/**
 * Processor for handling n8n node execution logic
 */

import { IExecuteFunctions, INodeExecutionData, NodeOperationError, GenericValue } from 'n8n-workflow';
import { JsonSanitizationService } from './JsonSanitizationService';
import {
	NodeParameters,
	ProcessingContext,
	ProcessingResult,
	OutputMode,
	ErrorHandlingMode,
	SanitizeResult,
} from '../types';

/**
 * Processor responsible for n8n-specific execution logic
 */
export class NodeProcessor {
	private readonly sanitizationService: JsonSanitizationService;

	constructor() {
		this.sanitizationService = new JsonSanitizationService();
	}

	/**
	 * Processes all input items
	 * @param executeFunctions - N8N execution context
	 * @param items - Input data items to process
	 * @returns Array of processed items
	 */
	async processItems(
		executeFunctions: IExecuteFunctions,
		items: INodeExecutionData[]
	): Promise<INodeExecutionData[]> {
		const results: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const context = this.createProcessingContext(executeFunctions, items[itemIndex], itemIndex);
			const result = await this.processItem(context);

			if (result.success && result.data) {
				results.push(result.data);
			} else if (result.error) {
				if (context.parameters.errorHandling === 'stop') {
					this.handleError(executeFunctions, result.error, context.parameters.errorHandling);
				} else {
					// For 'continue' mode, add error information to the output
					const errorItem: INodeExecutionData = {
						json: {
							[context.parameters.outputField]: null,
							error: {
								message: result.error.message,
								itemIndex: result.error.itemIndex,
								type: 'JSON_SANITIZATION_ERROR',
							},
							...(context.parameters.keepOriginal ? context.item.json : {}),
						},
						pairedItem: { item: itemIndex },
					};
					results.push(errorItem);
				}
			}
		}

		return results;
	}

	/**
	 * Creates processing context for a single item
	 * @param executeFunctions - N8N execution context
	 * @param item - The input data item
	 * @param itemIndex - Index of the current item
	 * @returns Processing context with parameters and item data
	 */
	private createProcessingContext(
		executeFunctions: IExecuteFunctions,
		item: INodeExecutionData,
		itemIndex: number
	): ProcessingContext {
		const parameters: NodeParameters = {
			inputField: executeFunctions.getNodeParameter('inputField', itemIndex) as string,
			outputMode: executeFunctions.getNodeParameter('outputMode', itemIndex) as OutputMode,
			outputField: executeFunctions.getNodeParameter('outputField', itemIndex) as string,
			keepOriginal: executeFunctions.getNodeParameter('keepOriginal', itemIndex) as boolean,
			errorHandling: executeFunctions.getNodeParameter('errorHandling', itemIndex) as ErrorHandlingMode,
		};

		return {
			item,
			itemIndex,
			parameters,
		};
	}

	/**
	 * Processes a single item through sanitization pipeline
	 * @param context - Processing context containing item and parameters
	 * @returns Processing result with success/error status
	 */
	private async processItem(context: ProcessingContext): Promise<ProcessingResult> {
		try {
			const inputValue = this.extractInputValue(context);
			const sanitizeResult = this.processInputValue(inputValue, context.parameters);
			const outputData = this.prepareOutputData(sanitizeResult, context.parameters);
			const resultItem = this.createResultItem(outputData, context);

			return { success: true, data: resultItem };
		} catch (error) {
			return {
				success: false,
				error: {
					message: error.message,
					itemIndex: context.itemIndex,
				}
			};
		}
	}

	/**
	 * Processes input value based on the selected output mode
	 * @param inputValue - The value to process
	 * @param parameters - Node configuration parameters
	 * @returns Sanitization result
	 */
	private processInputValue(inputValue: unknown, parameters: NodeParameters): SanitizeResult {
		if (parameters.outputMode === 'repair') {
			// For repair mode, ensure we have a string input
			if (typeof inputValue !== 'string') {
				throw new Error('Smart Repair mode requires string input');
			}
			return this.sanitizationService.repair(inputValue);
		} else {
			// For other modes, use normal sanitization
			return this.sanitizationService.sanitize(inputValue);
		}
	}

	/**
	 * Extracts input value from the specified field, supporting dot notation
	 * @param context - Processing context containing item and field information
	 * @returns Extracted value from the specified field
	 * @throws Error if field is not found or path is invalid
	 */
	private extractInputValue(context: ProcessingContext): unknown {
		const fieldPath = context.parameters.inputField;
		let value: unknown = context.item.json;

		// Handle dot notation (e.g., 'body.content')
		if (fieldPath.includes('.')) {
			const parts = fieldPath.split('.');
			let current: unknown = context.item.json;

			for (const [index, key] of parts.entries()) {
				if (current === null || current === undefined) {
					const pathSoFar = parts.slice(0, index).join('.');
					throw new Error(
						`Field path '${fieldPath}' is invalid: '${pathSoFar}' resolves to ${current}`
					);
				}

				if (typeof current !== 'object') {
					const pathSoFar = parts.slice(0, index).join('.');
					throw new Error(
						`Field path '${fieldPath}' is invalid: '${pathSoFar}' is not an object`
					);
				}

				current = (current as Record<string, unknown>)[key];
			}
			value = current;
		} else {
			// Simple field access
			value = (context.item.json as Record<string, unknown>)[fieldPath];
		}

		if (value === undefined || value === null) {
			throw new Error(`Field '${fieldPath}' not found in input data`);
		}

		return value;
	}

	/**
	 * Prepares output data based on the selected mode
	 * @param sanitizeResult - Result from sanitization process
	 * @param parameters - Node configuration parameters
	 * @returns Formatted output data according to selected mode
	 * @throws Error for unknown output modes
	 */
	private prepareOutputData(sanitizeResult: SanitizeResult, parameters: NodeParameters): unknown {
		switch (parameters.outputMode) {
			case 'parsed':
				return sanitizeResult.parsed;
			case 'string':
				return sanitizeResult.cleanedString;
			case 'both':
				return {
					parsed: sanitizeResult.parsed,
					cleanedString: sanitizeResult.cleanedString,
					wasAlreadyParsed: sanitizeResult.wasAlreadyParsed,
					wasRepaired: sanitizeResult.wasRepaired,
					originalType: typeof sanitizeResult.original,
				};
			case 'repair':
				return {
					parsed: sanitizeResult.parsed,
					repairedString: sanitizeResult.cleanedString,
					wasRepaired: sanitizeResult.wasRepaired,
					originalInput: sanitizeResult.original,
				};
			default:
				throw new Error(`Unknown output mode: ${parameters.outputMode}`);
		}
	}

	/**
	 * Creates the result item with proper structure for N8N
	 * @param outputData - The processed output data
	 * @param context - Processing context with original item and parameters
	 * @returns N8N execution data item
	 */
	private createResultItem(outputData: unknown, context: ProcessingContext): INodeExecutionData {
		const { item, itemIndex, parameters } = context;

		const newItem: INodeExecutionData = {
			json: parameters.keepOriginal ? { ...item.json } : {},
			pairedItem: { item: itemIndex },
		};

		newItem.json[parameters.outputField] = outputData as GenericValue;
		return newItem;
	}

	/**
	 * Handles errors based on the error handling mode
	 * @param executeFunctions - N8N execution context
	 * @param error - Error details with message and item index
	 * @param errorHandling - How to handle the error (stop or continue)
	 * @throws NodeOperationError if errorHandling is 'stop'
	 */
	private handleError(
		executeFunctions: IExecuteFunctions,
		error: { message: string; itemIndex: number },
		errorHandling: ErrorHandlingMode
	): void {
		if (errorHandling === 'stop') {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to sanitize JSON: ${error.message}`,
				{ itemIndex: error.itemIndex }
			);
		}

		// For 'continue' mode, the error is handled by returning error data
		// This will be handled by the caller
	}
}