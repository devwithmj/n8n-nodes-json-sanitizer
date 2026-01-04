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
				this.handleError(executeFunctions, result.error, context.parameters.errorHandling);
			}
		}

		return results;
	}

	/**
	 * Creates processing context for a single item
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
	 * Processes a single item
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
	 * Extracts input value from the specified field
	 */
	private extractInputValue(context: ProcessingContext): unknown {
		let value: unknown = (context.item.json as Record<string, unknown>)[context.parameters.inputField];

		// Handle dot notation (e.g., 'body.content')
		if (context.parameters.inputField.includes('.')) {
			const parts = context.parameters.inputField.split('.');
			let current: unknown = context.item.json as Record<string, unknown>;

			for (const key of parts) {
				current = (current as Record<string, unknown>)?.[key];
			}
			value = current;
		}

		if (value === undefined || value === null) {
			throw new Error(`Field '${context.parameters.inputField}' not found in input data`);
		}

		return value;
	}

	/**
	 * Prepares output data based on the selected mode
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
	 * Creates the result item with proper structure
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