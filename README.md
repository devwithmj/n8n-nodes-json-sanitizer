# n8n-nodes-json-sanitizer

This is an n8n community node. It provides a JSON Sanitizer for cleaning and normalizing JSON from various input formats.

The JSON Sanitizer node can handle:
- JSON strings with BOM (Byte Order Mark)
- Markdown code fences wrapping JSON
- Doubly escaped JSON strings
- Trailing commas
- JavaScript-style comments (// and /* */)
- Inconsistent line breaks
- Already parsed JSON objects
- **Smart Repair**: Automatically fixes malformed JSON using the jsonrepair library

## Architecture

This project follows a clean layered architecture that separates concerns for better maintainability and testability:

- **Types Layer**: Centralized type definitions and interfaces
- **Services Layer**: Business logic and n8n integration logic, utilizing the jsonrepair library for advanced JSON repair functionality
- **Configuration Layer**: UI properties and node metadata
- **Presentation Layer**: Thin n8n integration layer

For detailed architecture documentation, see [`nodes/JsonSanitizer/README.md`](nodes/JsonSanitizer/README.md).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The JSON Sanitizer node supports the following operations:

- **Sanitize JSON**: Clean and normalize JSON input from various formats
- **Output modes**:
  - Parsed Object: Return the parsed JSON object
  - Cleaned String: Return the sanitized JSON string
  - Both: Return both the parsed object and metadata
  - Smart Repair: Automatically fix malformed JSON using advanced repair techniques

## Credentials

No credentials required.

## Compatibility

- Minimum n8n version: 1.0.0
- Tested on n8n 1.x

## Dependencies

This node uses the following external dependencies:

- **jsonrepair**: A robust JSON repair library for automatically fixing malformed JSON strings

## Usage

1. Add the JSON Sanitizer node to your workflow
2. Configure the input field containing the JSON data
3. Choose the desired output mode
4. Set an output field name
5. Optionally configure error handling behavior

The node supports dot notation for nested fields (e.g., `body.content`) and can handle both string and object inputs.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [n8n workflow documentation](https://docs.n8n.io/)

## Version history

- 0.1.0: Initial release with basic JSON sanitization features
- 0.1.1: Refactored to clean layered architecture with improved maintainability
- 0.1.2: Switched to jsonrepair for robust repair; updated tests and improved fallback for unparseable input.
- 0.1.3: Improved JSON Sanitizer robustness with multi-stage parsing and repair, clearer error diagnostics, and reliable handling of bad control characters and malformed JSON.
