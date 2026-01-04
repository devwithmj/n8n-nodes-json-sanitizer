import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeProcessor } from './services/NodeProcessor';
import { nodeProperties } from './config/nodeProperties';

/**
 * N8N node for sanitizing and normalizing JSON data from various input formats
 * Provides comprehensive JSON cleaning, validation, and repair capabilities
 */
export class JsonSanitizer implements INodeType {
	/** N8N node type description and configuration */
	description: INodeTypeDescription = {
		displayName: 'JSON Sanitizer',
		name: 'jsonSanitizer',
		icon: 'file:JsonSanitizer.svg',
		group: ['transform'],
		version: 1,
		description: 'Sanitize, clean, and repair JSON data from various input formats including malformed JSON, escaped strings, and markdown-wrapped JSON',
		defaults: {
			name: 'JSON Sanitizer',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: nodeProperties,
		usableAsTool: true,
	};

	/**
	 * Execute the JSON Sanitizer node
	 * @param this - N8N execution context
	 * @returns Processed data items
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const processor = new NodeProcessor();
		const items = this.getInputData();
		const results = await processor.processItems(this, items);

		return [results];
	}
}