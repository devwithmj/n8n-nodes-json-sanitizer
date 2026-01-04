import { sanitizeJSON, repairJSON } from '../utils';

describe('sanitizeJSON', () => {
	describe('valid inputs', () => {
		test('should handle valid JSON string', () => {
			const input = '{"name": "test", "value": 123}';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ name: 'test', value: 123 });
			expect(result.cleanedString).toBe(input);
			expect(result.wasAlreadyParsed).toBe(false);
			expect(result.original).toBe(input);
		});

		test('should handle already parsed object', () => {
			const input = { name: 'Test', value: 123 };
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual(input);
			expect(result.cleanedString).toBe(JSON.stringify(input, null, 2));
			expect(result.wasAlreadyParsed).toBe(true);
			expect(result.original).toBe(input);
		});

		test('should handle array input', () => {
			const input = [1, 2, 3];
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual(input);
			expect(result.wasAlreadyParsed).toBe(true);
		});

		test('should remove BOM from string', () => {
			const input = '\uFEFF{"test": "value"}';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ test: 'value' });
			expect(result.wasAlreadyParsed).toBe(false);
		});

		test('should trim whitespace', () => {
			const input = '  {"test": "value"}  ';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ test: 'value' });
			expect(result.cleanedString).toBe('{"test": "value"}');
		});

		test('should remove markdown code fences', () => {
			const input = '```json\n{"test": "value"}\n```';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ test: 'value' });
			expect(result.cleanedString).toBe('{"test": "value"}');
		});

		test('should handle trailing commas', () => {
			const input = '{"test": "value",}';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ test: 'value' });
		});

		test('should remove comments', () => {
			const input = '{"test": "value", // comment\n"other": 123 /* block comment */}';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ test: 'value', other: 123 });
		});

		test('should normalize line endings', () => {
			const input = '{\r\n"test": "value"\r\n}';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ test: 'value' });
		});

		test('should handle doubly-escaped JSON', () => {
			const input = '"{\\"test\\": \\"value\\"}"';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ test: 'value' });
		});
	});

	describe('invalid inputs', () => {
		test('should throw error for null input', () => {
			expect(() => sanitizeJSON(null)).toThrow('Input must be a non-empty string or object');
		});

		test('should throw error for undefined input', () => {
			expect(() => sanitizeJSON(undefined)).toThrow('Input must be a non-empty string or object');
		});

		test('should throw error for empty string', () => {
			expect(() => sanitizeJSON('')).toThrow('Input must be a non-empty string or object');
		});

		test('should throw error for number input', () => {
			expect(() => sanitizeJSON(123)).toThrow('Input must be a string or object');
		});

		test('should throw error for boolean input', () => {
			expect(() => sanitizeJSON(true)).toThrow('Input must be a string or object');
		});

		test('should throw error for invalid JSON string', () => {
			const input = '{"invalid": json}';
			expect(() => sanitizeJSON(input)).toThrow('Failed to parse JSON after sanitization');
		});

		test('should throw error for unparseable doubly-escaped JSON', () => {
			const input = '"{\\"invalid\\": json}"';
			expect(() => sanitizeJSON(input)).toThrow('Failed to parse JSON after sanitization');
		});
	});

	describe('edge cases', () => {
		test('should handle empty object', () => {
			const input = '{}';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({});
		});

		test('should handle empty array', () => {
			const input = '[]';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual([]);
		});

		test('should handle nested objects', () => {
			const input = '{"nested": {"key": "value"}}';
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({ nested: { key: 'value' } });
		});

		test('should handle complex JSON with all features', () => {
			const input = `
				{
					"string": "value",
					"number": 123,
					"boolean": true,
					"null": null,
					"array": [1, 2, 3],
					"object": {
						"nested": "value"
					},
				}
			`;
			const result = sanitizeJSON(input);

			expect(result.parsed).toEqual({
				string: 'value',
				number: 123,
				boolean: true,
				null: null,
				array: [1, 2, 3],
				object: { nested: 'value' }
			});
		});
	});

	describe('repairJSON', () => {
		describe('successful repairs', () => {
			test('should repair JSON with missing quotes around keys', () => {
				const input = '{name: "John", age: 30}';
				const result = repairJSON(input);

				expect(result.parsed).toEqual({ name: 'John', age: 30 });
				expect(result.wasRepaired).toBe(true);
				expect(result.wasAlreadyParsed).toBe(false);
			});

			test('should repair JSON with single quotes', () => {
				const input = "{'name': 'John', 'age': 30}";
				const result = repairJSON(input);

				expect(result.parsed).toEqual({ name: 'John', age: 30 });
				expect(result.wasRepaired).toBe(true);
			});

			test('should repair JSON with trailing commas', () => {
				const input = '{"name": "John", "age": 30,}';
				const result = repairJSON(input);

				expect(result.parsed).toEqual({ name: 'John', age: 30 });
				expect(result.wasRepaired).toBe(true);
			});

			test('should repair JSON with missing commas', () => {
				const input = '{"name": "John" "age": 30}';
				const result = repairJSON(input);

				expect(result.parsed).toEqual({ name: 'John', age: 30 });
				expect(result.wasRepaired).toBe(true);
			});

			test('should repair JSON with comments', () => {
				const input = '{/* comment */ "name": "John", // another comment\n "age": 30}';
				const result = repairJSON(input);

				expect(result.parsed).toEqual({ name: 'John', age: 30 });
				expect(result.wasRepaired).toBe(true);
			});

			test('should handle already valid JSON in repair mode', () => {
				const input = '{"name": "John", "age": 30}';
				const result = repairJSON(input);

				expect(result.parsed).toEqual({ name: 'John', age: 30 });
				expect(result.wasRepaired).toBe(false); // Should use normal sanitization
				expect(result.wasAlreadyParsed).toBe(false);
			});
		});

		describe('repair failures', () => {
			test('should throw error for non-string input', () => {
				expect(() => repairJSON(123 as unknown)).toThrow('Smart Repair mode requires string input');
			});

			test('should throw error for null input', () => {
				expect(() => repairJSON(null as unknown)).toThrow('Smart Repair mode requires string input');
			});

			test('should handle completely invalid input by quoting it', () => {
				const input = 'this is not json at all';
				const result = repairJSON(input);

				expect(result.parsed).toBe('this is not json at all'); // jsonrepair wraps invalid input in quotes
				expect(result.wasRepaired).toBe(true);
			});
		});
	});
});