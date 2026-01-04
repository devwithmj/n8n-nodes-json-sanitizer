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

		test('should handle complex JSON with markdown fences', () => {
			const input = '```json\n{\n  "status": "fail",\n  "score": {\n    "overall_0_to_100": 40,\n    "truthfulness_0_to_100": 0,\n    "ats_compliance_0_to_100": 80,\n    "keyword_coverage_0_to_100": 90,\n    "hiring_manager_clarity_0_to_100": 90\n  },\n  "issues": [\n    {\n      "severity": "high",\n      "type": "invented_claim",\n      "location": "header",\n      "problem": "Entire candidate profile and experience cannot be validated against master resume",\n      "evidence": "CANDIDATE_MASTER_RESUME_JSON contains only \'1.2\' - no candidate data available for validation",\n      "fix": "Provide complete CANDIDATE_MASTER_RESUME_JSON with actual candidate experience and skills"\n    },\n    {\n      "severity": "high",\n      "type": "invented_claim",\n      "location": "summary",\n      "problem": "All summary claims unvalidated against master resume",\n      "evidence": "\'10+ years delivering scalable C#/.NET and SQL Server applications\' - master resume unavailable",\n      "fix": "Remove unvalidated claims until master resume provided"\n    },\n    {\n      "severity": "high",\n      "type": "invented_claim",\n      "location": "experience",\n      "problem": "All experience bullets and companies unvalidated against master resume",\n      "evidence": "Beeplife Inc., Phoner.ir, Doordast, Shatel - no master resume to verify existence or details",\n      "fix": "Remove all experience until validated against master resume"\n    }\n  ],\n  "patch_instructions": {\n    "priority_fixes": [\n      "Provide complete CANDIDATE_MASTER_RESUME_JSON for validation",\n      "Remove all unvalidated experience, skills, and claims"\n    ],\n    "allowed_edits": [],\n    "forbidden_edits": [\n      "add_new_skill_not_in_master",\n      "add_new_metrics",\n      "change_employers_titles_dates",\n      "invent_certifications",\n      "add_any_content_without_master_validation"\n    ],\n    "change_budget": {\n      "max_bullets_to_edit": 0,\n      "max_new_skills_to_surface": 0,\n      "max_total_edits": 0\n    }\n  },\n  "must_have_coverage": {\n    "present_in_skills": ["C#", ".NET", "SQL", "Git", "GitHub"],\n    "present_in_experience": ["C#", ".NET", "SQL", "GitHub", "Git"],\n    "missing_but_in_master": [],\n    "missing_and_not_in_master": []\n  }\n}\n```';
			const result = sanitizeJSON(input);

			const parsed = result.parsed as any;
			expect(parsed.status).toBe('fail');
			expect(parsed.score.overall_0_to_100).toBe(40);
			expect(parsed.issues).toHaveLength(3);
			expect(result.wasAlreadyParsed).toBe(false);
		});

		test('should handle JSON with control characters in repair mode', () => {
			const input = '{"url": "https://example.com\ninvalid"}';
			const result = repairJSON(input);

			const parsed = result.parsed as any;
			expect(parsed.url).toBe('https://example.com\ninvalid');
			expect(result.wasRepaired).toBe(true);
		});

		test('should handle malformed job listings JSON with truncated URLs', () => {
			const input = '[ { "id": "item-12345", "source": "example", "url": "https: ", "direct_url": "https: ", "name": "Sample Item", "provider": "Example Corp"...';
			const result = sanitizeJSON(input);

			const parsed = result.parsed as any;
			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed[0].id).toBe('item-12345');
			expect(parsed[0].source).toBe('example');
			expect(result.wasAlreadyParsed).toBe(false);
		});

		test('should parse stdout from external command output', () => {
			// Simulate the content from m.json - external command output with stdout containing JSON
			const commandOutput = [
				{
					"exitCode": 0,
					"stderr": "2026-01-04 19:16:04,057 - INFO - SampleService - operation completed",
					"stdout": '[ { "id": "item-12345", "source": "example", "url": "https: ", "direct_url": "https: ", "name": "Sample Item", "provider": "Example Corp"...'
				}
			];

			// Extract stdout and sanitize it
			const stdoutContent = commandOutput[0].stdout;
			const result = sanitizeJSON(stdoutContent);

			const parsed = result.parsed as any;
			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed[0].id).toBe('item-12345');
			expect(parsed[0].source).toBe('example');
			expect(result.wasAlreadyParsed).toBe(false);
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

		test('should handle invalid JSON string using jsonrepair fallback', () => {
			const input = '{"invalid": json}';
			const result = sanitizeJSON(input);

			const parsed = result.parsed as any;
			expect(parsed.invalid).toBe('json');
			expect(result.wasAlreadyParsed).toBe(false);
		});

		test('should handle unparseable doubly-escaped JSON using jsonrepair fallback', () => {
			const input = '"{\\"invalid\\": json}"';
			const result = sanitizeJSON(input);

			const parsed = result.parsed as any;
			expect(parsed.invalid).toBe('json');
			expect(result.wasAlreadyParsed).toBe(false);
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