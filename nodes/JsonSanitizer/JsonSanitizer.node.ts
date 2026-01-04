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
 */
export class JsonSanitizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSON Sanitizer',
		name: 'jsonSanitizer',
		icon: { light: 'file:JsonSanitizer.svg', dark: 'file:JsonSanitizer.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Sanitize and normalize JSON strings from various formats',
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