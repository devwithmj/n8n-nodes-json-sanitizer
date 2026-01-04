# JSON Sanitizer Node

A powerful n8n community node for cleaning, validating, and repairing JSON data from various input formats.

## Features

### JSON Sanitization
- **BOM Removal**: Removes Byte Order Marks that can cause parsing issues
- **Whitespace Trimming**: Cleans up extra whitespace and formatting
- **Markdown Fence Removal**: Extracts JSON from markdown code blocks (```json)
- **Comment Removal**: Strips both single-line (//) and multi-line (/* */) comments
- **Trailing Comma Cleanup**: Removes invalid trailing commas
- **Escaped String Handling**: Properly handles doubly-escaped JSON strings
- **Line Ending Normalization**: Standardizes line endings across platforms

### Smart Repair
The node includes advanced JSON repair capabilities that can fix common malformed JSON issues:
- Missing quotes around object keys
- Single quotes instead of double quotes  
- Missing commas between properties
- Trailing commas in arrays/objects
- Unescaped strings and values

### Output Modes
1. **Parsed Object**: Returns clean parsed JSON object
2. **Cleaned String**: Returns sanitized JSON as formatted string
3. **Both (with Metadata)**: Includes processing metadata and original type information
4. **Smart Repair**: Uses advanced repair techniques for malformed JSON

### Error Handling
- **Stop Workflow**: Halts execution on sanitization failures
- **Continue with Error Info**: Continues processing and includes error details in output

## Configuration

### Input Field
Specify the field containing JSON data to sanitize. Supports dot notation for nested fields:
- `json` - Simple field access
- `body.content` - Nested field access
- `response.data.items` - Deep nested access

### Output Field Name
The field where sanitized results will be stored (default: `sanitized`)

### Keep Original Data
Option to preserve all original input fields alongside sanitized results

## Use Cases

### Web Scraping
Clean malformed JSON from web APIs and scraped content that may include:
- HTML-escaped JSON strings
- JSON wrapped in markdown code blocks
- Comments or trailing commas
- Mixed quote styles

### Data Integration
Sanitize JSON data from various sources before processing:
- Legacy systems with non-standard JSON formatting
- CSV-to-JSON conversions with formatting issues  
- Manual data entry with formatting inconsistencies

### API Response Cleaning
Process API responses that return:
- Escaped JSON strings instead of objects
- JSON with embedded comments
- Malformed JSON with syntax errors

## Error Handling

When sanitization fails, the node provides detailed error information including:
- Original input preview
- Specific error messages
- Item index for debugging
- Attempted repair methods (in Smart Repair mode)

## Examples

### Basic Sanitization
Input:
```json
{
  "data": "{\\"name\\": \\"John\\", \\"age\\": 30}"
}
```

Output (parsed mode):
```json
{
  "sanitized": {
    "name": "John", 
    "age": 30
  }
}
```

### Smart Repair
Input:
```json
{
  "malformed": "{name: 'John', age: 30,}"
}
```

Output (repair mode):
```json
{
  "sanitized": {
    "parsed": {"name": "John", "age": 30},
    "repairedString": "{\"name\": \"John\", \"age\": 30}",
    "wasRepaired": true,
    "originalInput": "{name: 'John', age: 30,}"
  }
}
```

### Metadata Mode
Provides comprehensive information about the sanitization process:
```json
{
  "sanitized": {
    "parsed": {"key": "value"},
    "cleanedString": "{\"key\": \"value\"}",
    "wasAlreadyParsed": false,
    "wasRepaired": true,
    "originalType": "string"
  }
}
```