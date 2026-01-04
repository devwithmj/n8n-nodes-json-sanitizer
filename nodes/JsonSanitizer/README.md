# JSON Sanitizer Node - Architecture Documentation

## Overview

This n8n community node provides JSON sanitization and normalization capabilities for workflow automation. The codebase follows a clean, layered architecture that separates concerns and promotes maintainability.

## Architecture

### Directory Structure

```
nodes/JsonSanitizer/
├── config/                 # Configuration layer
│   ├── nodeDescription.ts  # Node metadata factory
│   └── nodeProperties.ts   # UI properties configuration
├── services/               # Business logic layer
│   ├── JsonSanitizationService.ts  # Core sanitization logic
│   └── NodeProcessor.ts    # n8n-specific processing logic
├── types/                  # Type definitions
│   └── index.ts           # TypeScript interfaces and types
├── __tests__/             # Test files
│   └── utils.test.ts      # Unit tests
├── JsonSanitizer.node.ts  # Main node class (thin layer)
├── JsonSanitizer.node.json # Node metadata
├── utils.ts               # Legacy compatibility layer
├── JsonSanitizer.svg      # Light mode icon
└── JsonSanitizer.dark.svg # Dark mode icon
```

### Layered Architecture

#### 1. Types Layer (`types/`)
- **Purpose**: Define all TypeScript interfaces and types
- **Responsibilities**:
  - `SanitizeResult`: Result of sanitization operations
  - `NodeParameters`: Node configuration parameters
  - `ProcessingContext`: Context for item processing
  - `ProcessingResult`: Result of processing operations

#### 2. Services Layer (`services/`)
- **Purpose**: Contain business logic and n8n integration logic
- **Components**:
  - `JsonSanitizationService`: Pure business logic for JSON sanitization
  - `NodeProcessor`: n8n-specific processing and error handling

#### 3. Configuration Layer (`config/`)
- **Purpose**: Separate UI configuration from business logic
- **Components**:
  - `nodeDescription.ts`: Factory for node metadata
  - `nodeProperties.ts`: UI properties configuration

#### 4. Presentation Layer (`JsonSanitizer.node.ts`)
- **Purpose**: Thin integration layer with n8n framework
- **Responsibilities**:
  - Implement `INodeType` interface
  - Delegate execution to services
  - Minimal logic, maximum delegation

#### 5. Compatibility Layer (`utils.ts`)
- **Purpose**: Maintain backward compatibility
- **Responsibilities**:
  - Re-export sanitization functionality
  - Support existing tests and integrations

## Design Principles

### Single Responsibility Principle (SRP)
Each class and module has a single, well-defined responsibility:
- `JsonSanitizationService`: Only handles JSON sanitization logic
- `NodeProcessor`: Only handles n8n-specific processing
- `JsonSanitizer`: Only integrates with n8n framework

### Dependency Inversion
High-level modules don't depend on low-level modules. Both depend on abstractions (interfaces).

### Separation of Concerns
- **Business Logic**: Isolated in services layer
- **UI Configuration**: Separated into config layer
- **Type Definitions**: Centralized in types layer
- **Framework Integration**: Minimal in main node class

## Key Benefits

### Maintainability
- Clear separation of concerns makes code easier to understand and modify
- Each layer can be tested and modified independently
- Changes to business logic don't affect n8n integration

### Testability
- Business logic can be unit tested without n8n dependencies
- Services can be mocked for integration testing
- Clear interfaces make testing straightforward

### Extensibility
- New sanitization features can be added to `JsonSanitizationService`
- New output modes can be added without changing core logic
- Configuration can be extended without touching business logic

### Reusability
- `JsonSanitizationService` can be used in other contexts
- Types can be shared across different implementations
- Services are framework-agnostic

## Usage Examples

### Basic Usage
```typescript
import { JsonSanitizationService } from './services/JsonSanitizationService';

const service = new JsonSanitizationService();
const result = service.sanitize('{"name": "test"}');
```

### Node Integration
```typescript
import { NodeProcessor } from './services/NodeProcessor';

const processor = new NodeProcessor();
const results = await processor.processItems(executeFunctions, items);
```

## Testing Strategy

### Unit Tests
- Test `JsonSanitizationService` in isolation
- Mock external dependencies
- Test edge cases and error conditions

### Integration Tests
- Test `NodeProcessor` with mocked n8n functions
- Test end-to-end node execution
- Verify error handling scenarios

### Legacy Compatibility
- Existing tests continue to work via `utils.ts` re-exports
- No breaking changes to public API

## Future Improvements

### Potential Enhancements
- Add streaming support for large JSON files
- Implement caching for repeated sanitization patterns
- Add support for custom sanitization rules
- Create a plugin system for extensible sanitization

### Performance Optimizations
- Implement worker threads for CPU-intensive sanitization
- Add LRU caching for frequently processed patterns
- Optimize string operations with streaming parsers

### Monitoring and Observability
- Add performance metrics
- Implement structured logging
- Add health checks and diagnostics