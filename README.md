# n8n-nodes-json-sanitizer

This is an n8n community node. It provides a JSON Sanitizer node for cleaning and normalizing JSON data from various input formats.

The JSON Sanitizer node can handle:
- JSON strings with BOM (Byte Order Mark)
- Markdown code fences wrapping JSON
- Doubly-escaped JSON strings
- Trailing commas
- JavaScript-style comments (// and /* */)
- Inconsistent line endings
- Already parsed JSON objects

## Architecture

This project follows a clean, layered architecture that separates concerns for better maintainability and testability:

- **Types Layer**: Centralized type definitions and interfaces
- **Services Layer**: Business logic and n8n integration logic
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
- **Output Modes**:
  - Parsed Object: Return the parsed JSON object
  - Cleaned String: Return the sanitized JSON string
  - Both: Return both the parsed object and metadata

## Credentials

This node does not require any credentials.

## Compatibility

- Minimum n8n version: 1.0.0
- Tested with n8n versions: 1.x

## Usage

1. Add the JSON Sanitizer node to your workflow
2. Configure the input field containing the JSON data
3. Choose the desired output mode
4. Set the output field name
5. Optionally configure error handling behavior

The node supports dot notation for nested fields (e.g., `body.content`) and can handle both string and object inputs.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [n8n workflow documentation](https://docs.n8n.io/)

## Version history

- 0.1.0: Initial release with basic JSON sanitization features
- 0.1.1: Refactored to clean, layered architecture with improved maintainability
