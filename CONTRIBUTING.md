# Contributing to Market Sizing MCP Server

Thank you for your interest in contributing to the Market Sizing MCP Server! This document provides guidelines and information for contributors.

## 📋 Usage Guidelines

### Documentation Structure

This project uses a professional documentation structure designed for maintainability and scalability. Understanding this structure is crucial for effective contribution.

#### 📁 Documentation Organization

```
doc/
├── README.md                          # Documentation index and navigation
├── RELEASE-NOTES.md                   # Chronological change tracking (PRIMARY)
├── NOTIFICATIONS-IMPLEMENTATION.md    # Detailed implementation guides
└── TEST-ORGANIZATION.md               # Specific feature documentation
```

#### 📝 Release Notes Usage

**IMPORTANT**: All changes must be documented in `doc/RELEASE-NOTES.md`

1. **When to Update Release Notes**
   - ✅ Adding new features
   - ✅ Fixing significant bugs
   - ✅ Making architectural changes
   - ✅ Updating dependencies with impact
   - ✅ Performance improvements
   - ✅ Security updates
   - ❌ Minor typo fixes
   - ❌ Code formatting changes

2. **How to Document Changes**
   ```markdown
   ### [Date] - [Feature/Change Title]

   **[Category]: [Brief Description]**

   #### 🔧 **[Implementation Section]**
   - **[Specific Feature]** - What was implemented
   - **[Technical Detail]** - How it works
   - **[Impact]** - Effect on users/developers

   #### 📁 **Files Changed**
   - `src/path/file.ts` - Description of changes
   - `tests/path/test.js` - Test additions/modifications

   #### 🎯 **Benefits Achieved**
   - **Performance**: 40% improvement in response time
   - **Maintainability**: Better code organization
   ```

3. **Documentation Categories**
   - **Major Feature**: New tools, transport protocols, significant capabilities
   - **Enhancement**: Improvements to existing features
   - **Bug Fix**: Important bug resolutions
   - **Infrastructure**: Build, deployment, testing improvements
   - **Security**: Security-related updates
   - **Performance**: Optimization and performance improvements

#### 🗂️ File Organization Rules

1. **DO NOT create new top-level MD files** for individual tasks
2. **USE `doc/RELEASE-NOTES.md`** for all change documentation
3. **CREATE implementation guides** in `doc/` only for complex features
4. **UPDATE existing guides** rather than creating new ones when possible

### Testing Guidelines

#### 🧪 Professional Test Structure

```
tests/
├── unit/              # Fast, isolated component tests (< 100ms)
├── integration/       # Component interaction tests (100ms - 1s)
├── e2e/              # Full workflow tests (1s+)
├── fixtures/         # Centralized test data
├── utils/            # Test utilities and helpers
└── archive/          # Legacy tests (reference only)
```

#### 🏃‍♂️ Running Tests

```bash
# Quick test commands
npm run test:unit           # Fast unit tests only
npm run test:integration    # Integration tests only  
npm run test:e2e           # End-to-end tests only
npm run test:coverage      # Full coverage report

# Using test runner
node tests/run-tests.js unit --watch    # Watch mode for development
node tests/run-tests.js e2e --debug     # Debug end-to-end issues
node tests/run-tests.js all --coverage  # Complete test run

# CI/CD testing
npm run test:ci            # Optimized for continuous integration
```

#### ✅ Test Requirements for Contributors

1. **New Features**: Must include unit, integration, and e2e tests
2. **Bug Fixes**: Must include regression tests
3. **Coverage**: Maintain 90%+ code coverage
4. **Categories**: Choose appropriate test category:
   - **Unit**: Testing individual functions/classes in isolation
   - **Integration**: Testing MCP protocol compliance and server behavior
   - **E2E**: Testing complete workflows through real transports

#### 🛠️ Writing Tests

```typescript
// Unit Test Example
describe('MarketAnalysisTools.industrySearch', () => {
  test('should return filtered industries', async () => {
    const result = await MarketAnalysisTools.industrySearch({
      query: 'technology',
      limit: 5
    });
    
    expect(result.success).toBe(true);
    expect(result.content.length).toBeLessThanOrEqual(5);
  });
});

// Integration Test Example  
describe('MCP Server Initialization', () => {
  test('should initialize with all tools registered', async () => {
    const { server, cleanup } = await createServer();
    
    const tools = await server.request({ method: 'tools/list' });
    expect(tools.tools).toHaveLength(4);
    
    await cleanup();
  });
});

// E2E Test Example
describe('HTTP Transport', () => {
  test('should handle tool calls via HTTP', async () => {
    const response = await makeHttpRequest(3002, '/message', {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: 'industry_search', arguments: { query: 'test' } }
    });
    
    expect(response.statusCode).toBe(200);
  });
});
```

### Development Workflow

#### 🔄 Standard Development Process

1. **Before Starting**
   ```bash
   # Update documentation understanding
   git pull origin main
   # Read recent changes in doc/RELEASE-NOTES.md
   # Check tests/README.md for testing guidelines
   ```

2. **During Development**
   ```bash
   # Run relevant tests continuously
   npm run test:unit -- --watch
   
   # Check your changes
   npm run test:coverage
   npm run lint:fix
   ```

3. **Before Committing**
   ```bash
   # Full test suite
   npm run test:ci
   
   # Update documentation
   # Add entry to doc/RELEASE-NOTES.md
   # Update implementation guides if needed
   ```

#### 📝 Commit Message Standards

```bash
# Feature commits
git commit -m "feat(tools): add market opportunity analysis tool

- Implement opportunity scoring algorithm
- Add competitive analysis integration  
- Include growth projection calculations
- Update doc/RELEASE-NOTES.md with details"

# Bug fix commits
git commit -m "fix(notifications): resolve memory leak in SSE connections

- Fix event listener cleanup in notification service
- Add proper connection management
- Include regression tests
- Document fix in doc/RELEASE-NOTES.md"

# Documentation commits  
git commit -m "docs: update release notes with performance improvements

- Add December 6, 2024 performance optimization entry
- Document 40% response time improvement
- Include technical implementation details"
```

#### 🎯 Pull Request Guidelines

1. **PR Title Format**
   ```
   [Type]: Brief description of changes
   
   Examples:
   feat: Add market opportunity analysis tool
   fix: Resolve SSE connection memory leak  
   docs: Update testing guidelines
   refactor: Improve notification service architecture
   ```

2. **PR Description Template**
   ```markdown
   ## Changes Made
   - [ ] Feature/fix implementation
   - [ ] Tests added/updated
   - [ ] Documentation updated in doc/RELEASE-NOTES.md
   - [ ] Breaking changes documented (if any)

   ## Testing
   - [ ] Unit tests pass: `npm run test:unit`
   - [ ] Integration tests pass: `npm run test:integration`
   - [ ] E2E tests pass: `npm run test:e2e`
   - [ ] Coverage maintained: `npm run test:coverage`

   ## Documentation
   - [ ] Added entry to doc/RELEASE-NOTES.md
   - [ ] Updated relevant implementation guides
   - [ ] README.md updated (if user-facing changes)

   ## Related Issues
   Closes #123
   Related to #456
   ```

### Code Quality Standards

#### 🔍 Code Review Checklist

**For Reviewers:**
- [ ] Changes documented in `doc/RELEASE-NOTES.md`
- [ ] Appropriate tests included and passing
- [ ] Code follows TypeScript best practices
- [ ] No breaking changes without documentation
- [ ] Performance impact considered
- [ ] Security implications reviewed

**For Contributors:**
- [ ] Self-review completed
- [ ] All tests passing locally
- [ ] Documentation updated
- [ ] Commit messages follow standards
- [ ] No sensitive data exposed

#### 🛡️ Security Considerations

1. **API Keys and Secrets**
   - Never commit API keys or secrets
   - Use environment variables
   - Update `.env.example` for new configuration

2. **Input Validation**
   - Use Zod schemas for all inputs
   - Sanitize user-provided data
   - Validate MCP protocol compliance

3. **Dependencies**
   - Keep dependencies updated
   - Review security advisories
   - Document dependency changes in Release Notes

### Project Maintenance

#### 📊 Monitoring and Metrics

When contributing features that affect performance or user experience:

1. **Add Metrics**: Include relevant Prometheus metrics
2. **Monitor Impact**: Check performance before/after changes
3. **Document Changes**: Include performance impact in Release Notes

#### 🔄 Release Process

For maintainers releasing new versions:

1. **Pre-release Checklist**
   - [ ] All tests passing in CI
   - [ ] Documentation up to date
   - [ ] Release Notes reviewed and complete
   - [ ] Version bumped appropriately

2. **Release Documentation**
   - [ ] Tag version matches Release Notes
   - [ ] GitHub release includes highlights
   - [ ] Breaking changes clearly documented

### Notification System Usage

#### 🔔 Working with Notifications

The TAM MCP Server includes a comprehensive notification system for real-time updates. Understanding how to work with this system is essential for contributors.

#### 📡 Notification Types

1. **Progress Notifications** (`notifications/progress`)
   ```typescript
   // Send progress updates for long-running operations
   notificationService.sendProgress(clientId, {
     operation: 'market_analysis',
     progress: 0.65,
     message: 'Analyzing market segments...',
     total: 100,
     completed: 65
   });
   ```

2. **General Messages** (`notifications/message`)
   ```typescript
   // Send informational messages
   notificationService.sendMessage(clientId, {
     level: 'info',
     message: 'Market data cache updated',
     timestamp: new Date().toISOString()
   });
   ```

3. **Resource Updates** (`notifications/resources/updated`)
   ```typescript
   // Notify about resource changes
   notificationService.sendResourceUpdate(clientId, {
     resourceType: 'market_data',
     action: 'updated',
     resourceId: 'tech_industry_2024',
     changes: ['size', 'growth_rate']
   });
   ```

#### 🚀 Transport Integration

**SSE Transport** (`src/sse-new.ts`)
```typescript
// Notifications are automatically sent via Server-Sent Events
// No additional code needed - handled by transport layer

// Example: Client receives notifications as SSE events
// data: {"method": "notifications/progress", "params": {...}}
```

**HTTP Transport** (`src/http.ts`)
```typescript
// Notifications are sent via HTTP streaming
// Handled automatically by the transport layer

// Example: WebSocket-like behavior over HTTP
```

#### 🧪 Testing Notifications

When adding notification functionality:

1. **Unit Tests** - Test notification service methods
   ```typescript
   describe('NotificationService', () => {
     test('should send progress notification', () => {
       const mockSend = jest.fn();
       const service = new NotificationService(mockSend);
       
       service.sendProgress('client1', {
         operation: 'test',
         progress: 0.5
       });
       
       expect(mockSend).toHaveBeenCalledWith(
         'client1',
         expect.objectContaining({
           method: 'notifications/progress'
         })
       );
     });
   });
   ```

2. **Integration Tests** - Test server notification integration
   ```typescript
   describe('Server Notifications', () => {
     test('should register notification handlers', async () => {
       const { server } = await createServer();
       // Test that server properly handles notification setup
     });
   });
   ```

3. **E2E Tests** - Test notification delivery via transports
   ```typescript
   describe('E2E Notifications', () => {
     test('should deliver notifications via SSE', async () => {
       // Test actual notification delivery through SSE transport
       const notifications = await listenForNotifications(sseUrl);
       // Trigger operation that sends notifications
       // Verify notifications received
     });
   });
   ```

#### 📋 Notification Guidelines for Contributors

1. **When to Use Notifications**
   - ✅ Long-running operations (> 1 second)
   - ✅ Important status changes
   - ✅ Error conditions that users should know about
   - ✅ Resource updates that affect cached data
   - ❌ Every API call completion
   - ❌ Minor internal state changes
   - ❌ Debug information

2. **Notification Design Principles**
   - **Clear Messages**: Use descriptive, user-friendly text
   - **Appropriate Frequency**: Don't spam with too many updates
   - **Useful Information**: Include actionable details
   - **Consistent Format**: Follow established notification schemas

3. **Performance Considerations**
   - Notifications are asynchronous and non-blocking
   - Failed notification delivery doesn't affect operations
   - Use appropriate notification levels (info, warning, error)
   - Consider rate limiting for high-frequency operations

#### 🔧 Adding New Notification Types

To add a new notification type:

1. **Define Schema** in `src/types/index.ts`
   ```typescript
   export interface CustomNotification {
     type: 'custom_event';
     data: {
       customField: string;
       metadata?: Record<string, any>;
     };
     timestamp: string;
   }
   ```

2. **Add Service Method** in `src/notifications/notification-service.ts`
   ```typescript
   sendCustomNotification(clientId: string, data: CustomNotification['data']) {
     this.sendNotification(clientId, {
       method: 'notifications/custom_event',
       params: {
         type: 'custom_event',
         data,
         timestamp: new Date().toISOString()
       }
     });
   }
   ```

3. **Add Tests** for the new notification type
4. **Document in Release Notes** with usage examples

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- TypeScript knowledge
- Familiarity with Express.js and MCP concepts

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/market-sizing-mcp.git
   cd market-sizing-mcp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   npm run test:coverage
   ```

## 🏗 Project Structure

Understanding the codebase structure will help you contribute effectively:

```
src/
├── index.ts              # Main entry point and server initialization
├── server.ts             # Express server configuration and middleware
├── types/
│   └── schemas.ts        # Zod schemas and TypeScript type definitions
├── tools/
│   └── mcpTools.ts       # MCP tool implementations and business logic
├── services/
│   ├── dataService.ts    # Data operations and external API integrations
│   └── cacheService.ts   # Caching logic and performance optimization
└── utils/
    └── logger.ts         # Logging utilities and structured logging
```

## 🛠 Development Guidelines

### Code Style

We use strict TypeScript with comprehensive linting and formatting:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Code linting with custom rules for consistency
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Structured commit messages

### Coding Standards

1. **TypeScript Best Practices**
   ```typescript
   // Use strict types - avoid 'any'
   interface MarketData {
     size: number;
     growth: number;
     segments: MarketSegment[];
   }

   // Use Zod for runtime validation
   const marketSizeSchema = z.object({
     industry: z.string().min(1),
     geography: z.string(),
     year: z.number().int().min(2020).max(2030)
   });
   ```

2. **Error Handling**
   ```typescript
   // Use structured error handling
   try {
     const result = await dataService.getMarketSize(params);
     return { success: true, data: result };
   } catch (error) {
     logger.error('Market size calculation failed', { error, params });
     throw new MCPError(
       'CALCULATION_FAILED',
       'Unable to calculate market size',
       { originalError: error }
     );
   }
   ```

3. **Logging Standards**
   ```typescript
   // Use structured logging with context
   logger.info('Processing market analysis request', {
     tool: 'calculate_tam',
     industry: params.industry,
     requestId: context.requestId
   });

   // Log business metrics
   logger.business('market_analysis_completed', {
     tool: 'calculate_tam',
     execution_time: Date.now() - startTime,
     result_value: result.tam
   });
   ```

4. **Testing Requirements**
   ```typescript
   // Unit tests for all functions
   describe('MCPTools.calculateTAM', () => {
     it('should calculate TAM for valid industry data', async () => {
       const params = { industry: 'SaaS', geography: 'Global' };
       const result = await mcpTools.calculateTAM(params);
       
       expect(result.success).toBe(true);
       expect(result.data.tam).toBeGreaterThan(0);
       expect(result.data.methodology).toBeDefined();
     });
   });
   ```

### Git Workflow

1. **Branch Naming**
   - `feature/description` - New features
   - `fix/description` - Bug fixes
   - `docs/description` - Documentation updates
   - `refactor/description` - Code refactoring
   - `test/description` - Test improvements

2. **Commit Messages**
   Use [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(tools): add market opportunity analysis tool
   fix(cache): resolve cache invalidation issue
   docs(readme): update API documentation
   refactor(services): improve data service performance
   test(integration): add comprehensive API tests
   ```

3. **Pull Request Process**
   - Create feature branch from `main`
   - Make changes with comprehensive tests
   - Update documentation if needed
   - Run linting and tests locally
   - Create PR with descriptive title and body
   - Address review feedback promptly

## 🧪 Testing Guidelines

### Test Structure

```
tests/
├── unit/                 # Unit tests for individual components
│   ├── tools/
│   ├── services/
│   └── utils/
├── integration/          # API endpoint integration tests
├── performance/          # Load and performance tests
└── fixtures/            # Test data and mocks
```

### Writing Tests

1. **Unit Tests**
   ```typescript
   // Test individual functions in isolation
   describe('DataService.getIndustryData', () => {
     beforeEach(() => {
       mockApiProvider.reset();
     });

     it('should return industry data for valid industry', async () => {
       const industryData = await dataService.getIndustryData('technology');
       expect(industryData).toMatchSchema(industryDataSchema);
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   // Test complete API workflows
   describe('POST /mcp/tools/calculate_tam', () => {
     it('should calculate TAM and return valid response', async () => {
       const response = await request(app)
         .post('/mcp/tools/calculate_tam')
         .send({ industry: 'SaaS', geography: 'North America' })
         .expect(200);

       expect(response.body.success).toBe(true);
       expect(response.body.data.tam).toBeGreaterThan(0);
     });
   });
   ```

3. **Performance Tests**
   ```typescript
   // Test performance under load
   describe('Performance Tests', () => {
     it('should handle 100 concurrent TAM calculations', async () => {
       const promises = Array.from({ length: 100 }, () =>
         request(app).post('/mcp/tools/calculate_tam')
       );
       
       const results = await Promise.all(promises);
       expect(results.every(r => r.status === 200)).toBe(true);
     });
   });
   ```

### Test Coverage

- Maintain **90%+** code coverage
- Cover all error scenarios
- Test edge cases and boundary conditions
- Include performance regression tests

## 🛠️ Tool Development Guidelines

### Understanding MCP Tools Architecture

The TAM MCP Server implements tools following the Model Context Protocol specification. Each tool is a self-contained analysis function that can be called via MCP requests.

#### 🏗️ Tool Structure

```typescript
// Tool Definition Structure
interface MCPTool {
  name: string;           // Unique tool identifier
  description: string;    // Human-readable description
  inputSchema: ZodSchema; // Input validation schema
  handler: Function;      // Implementation function
}
```

#### 📋 Tool Development Checklist

When developing a new tool, ensure you complete all of these steps:

1. **Planning Phase**
   - [ ] Define tool purpose and scope
   - [ ] Research data requirements and sources
   - [ ] Design input/output schemas
   - [ ] Consider performance implications
   - [ ] Plan notification integration (if needed)

2. **Implementation Phase**
   - [ ] Create Zod schemas for validation
   - [ ] Implement core business logic
   - [ ] Add comprehensive error handling
   - [ ] Include logging and metrics
   - [ ] Integrate with notification system
   - [ ] Add caching where appropriate

3. **Testing Phase**
   - [ ] Write unit tests for all functions
   - [ ] Add integration tests for MCP compliance
   - [ ] Create e2e tests for complete workflows
   - [ ] Test error scenarios and edge cases
   - [ ] Verify performance requirements

4. **Documentation Phase**
   - [ ] Update `doc/RELEASE-NOTES.md` with implementation details
   - [ ] Add tool to README.md feature list
   - [ ] Include usage examples
   - [ ] Document any new dependencies

#### 🎯 Tool Design Principles

1. **Single Responsibility**: Each tool should have one clear purpose
2. **Input Validation**: Always validate inputs with Zod schemas
3. **Error Handling**: Provide meaningful error messages
4. **Performance**: Consider caching and optimization
5. **Testability**: Design for easy unit testing
6. **Observability**: Include metrics and logging

#### 🔧 Tool Implementation Template

```typescript
// 1. Define schemas (src/types/index.ts)
export const myToolInputSchema = z.object({
  industry: z.string().min(1),
  region: z.string().optional().default('Global'),
  parameters: z.object({
    timeframe: z.number().int().min(1).max(10)
  }).optional()
});

export const myToolResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    result: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    methodology: z.string()
  }),
  metadata: z.object({
    tool: z.string(),
    execution_time: z.number(),
    data_sources: z.array(z.string()),
    cache_used: z.boolean()
  })
});

// 2. Implement tool (src/tools/market-tools.ts)
export class MarketAnalysisTools {
  async myTool(input: z.infer<typeof myToolInputSchema>): Promise<MCPResponse> {
    const startTime = Date.now();
    const requestId = `my_tool_${Date.now()}`;
    
    try {
      // Input validation
      const validatedInput = myToolInputSchema.parse(input);
      
      // Log start
      this.logger.info('Starting my tool analysis', {
        tool: 'my_tool',
        requestId,
        input: validatedInput
      });
      
      // Send progress notification for long operations
      if (this.notificationService) {
        this.notificationService.sendProgress('client', {
          operation: 'my_tool_analysis',
          progress: 0.1,
          message: 'Initializing analysis...'
        });
      }
      
      // Check cache first
      const cacheKey = `my_tool_${JSON.stringify(validatedInput)}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        this.logger.info('Returning cached result', { requestId });
        return cached;
      }
      
      // Perform analysis
      const analysisResult = await this.performMyAnalysis(validatedInput);
      
      // Progress update
      if (this.notificationService) {
        this.notificationService.sendProgress('client', {
          operation: 'my_tool_analysis',
          progress: 0.8,
          message: 'Finalizing results...'
        });
      }
      
      // Prepare response
      const response = {
        success: true,
        data: {
          result: analysisResult.data,
          confidence: analysisResult.confidence,
          methodology: analysisResult.methodology
        },
        metadata: {
          tool: 'my_tool',
          execution_time: Date.now() - startTime,
          data_sources: analysisResult.sources,
          cache_used: false
        }
      };
      
      // Cache result
      await this.cacheService.set(cacheKey, response, 3600); // 1 hour TTL
      
      // Log completion
      this.logger.business('my_tool_completed', {
        requestId,
        execution_time: response.metadata.execution_time,
        confidence: response.data.confidence
      });
      
      // Final progress notification
      if (this.notificationService) {
        this.notificationService.sendProgress('client', {
          operation: 'my_tool_analysis',
          progress: 1.0,
          message: 'Analysis complete'
        });
      }
      
      return response;
      
    } catch (error) {
      this.logger.error('My tool analysis failed', {
        requestId,
        error: error.message,
        input
      });
      
      // Send error notification
      if (this.notificationService) {
        this.notificationService.sendMessage('client', {
          level: 'error',
          message: `Analysis failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
      
      throw new MCPError(
        'ANALYSIS_FAILED',
        `My tool analysis failed: ${error.message}`,
        { originalError: error, requestId }
      );
    }
  }
  
  private async performMyAnalysis(input: any) {
    // Implement your core business logic here
    // This should be pure business logic without MCP concerns
    return {
      data: ['result1', 'result2'],
      confidence: 0.85,
      methodology: 'Advanced market analysis',
      sources: ['source1', 'source2']
    };
  }
}

// 3. Add tool registration (src/tools/market-tools.ts)
export static getToolDefinitions(): MCPTool[] {
  return [
    // ...existing tools...
    {
      name: 'my_tool',
      description: 'Comprehensive market analysis tool',
      inputSchema: zodToJsonSchema(myToolInputSchema) as JSONSchema7,
      handler: this.myTool.bind(this)
    }
  ];
}

// 4. Add comprehensive tests (tests/unit/tools.test.js)
describe('MarketAnalysisTools.myTool', () => {
  let tools;
  
  beforeEach(() => {
    tools = new MarketAnalysisTools();
  });
  
  test('should execute successfully with valid input', async () => {
    const result = await tools.myTool({
      industry: 'Technology',
      region: 'North America'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.result).toBeInstanceOf(Array);
    expect(result.data.confidence).toBeGreaterThan(0);
    expect(result.metadata.tool).toBe('my_tool');
  });
  
  test('should handle invalid input gracefully', async () => {
    await expect(tools.myTool({})).rejects.toThrow('ANALYSIS_FAILED');
  });
  
  test('should use cache when available', async () => {
    const input = { industry: 'Technology' };
    
    // First call
    const result1 = await tools.myTool(input);
    expect(result1.metadata.cache_used).toBe(false);
    
    // Second call should use cache
    const result2 = await tools.myTool(input);
    expect(result2.metadata.cache_used).toBe(true);
  });
});
```

#### 🔍 Tool Quality Standards

1. **Performance Requirements**
   - Response time < 5 seconds for simple operations
   - < 30 seconds for complex analysis
   - Proper caching for expensive operations
   - Progress notifications for operations > 3 seconds

2. **Error Handling Standards**
   - Validate all inputs with Zod schemas
   - Provide specific error messages
   - Include error context for debugging
   - Send user-friendly notifications

3. **Logging Requirements**
   - Log operation start/completion
   - Include request IDs for tracing
   - Log business metrics for monitoring
   - Log errors with full context

4. **Testing Requirements**
   - Unit tests for all tool methods
   - Integration tests for MCP compliance
   - E2E tests for complete workflows
   - Error scenario testing
   - Performance regression tests

## 📊 Adding New Tools

To add a new market analysis tool:

1. **Define Schema**
   ```typescript
   // In src/types/schemas.ts
   export const newToolInputSchema = z.object({
     parameter1: z.string(),
     parameter2: z.number().optional()
   });

   export const newToolResponseSchema = z.object({
     result: z.array(z.string()),
     metadata: z.object({
       source: z.string(),
       timestamp: z.string()
     })
   });
   ```

2. **Implement Tool**
   ```typescript
   // In src/tools/mcpTools.ts
   async newTool(input: z.infer<typeof newToolInputSchema>): Promise<MCPResponse> {
     const startTime = Date.now();
     
     try {
       // Validate input
       const validatedInput = newToolInputSchema.parse(input);
       
       // Business logic
       const result = await this.dataService.performNewAnalysis(validatedInput);
       
       // Log success
       this.logger.business('new_tool_executed', {
         execution_time: Date.now() - startTime,
         input_params: validatedInput
       });
       
       return {
         success: true,
         data: result,
         metadata: {
           tool: 'new_tool',
           execution_time: Date.now() - startTime,
           cache_used: false
         }
       };
     } catch (error) {
       this.logger.error('New tool execution failed', { error, input });
       throw new MCPError('TOOL_EXECUTION_FAILED', 'Tool execution failed', { error });
     }
   }
   ```

3. **Add Route**
   ```typescript
   // In src/server.ts
   app.post('/mcp/tools/new_tool', async (req, res) => {
     try {
       const result = await mcpTools.newTool(req.body);
       res.json(result);
     } catch (error) {
       handleMCPError(error, res);
     }
   });
   ```

4. **Write Tests**
   ```typescript
   // Add comprehensive tests
   describe('MCPTools.newTool', () => {
     it('should execute new tool successfully', async () => {
       const result = await mcpTools.newTool({ parameter1: 'value' });
       expect(result.success).toBe(true);
     });
   });
   ```

5. **Update Documentation**
   - Update README.md with tool description
   - Add API documentation
   - Include usage examples

## 🔧 Data Integration

### Adding New Data Sources

1. **External API Integration**
   ```typescript
   // In src/services/dataService.ts
   async integrateNewProvider(apiKey: string): Promise<void> {
     this.newProvider = new NewProviderClient({
       apiKey,
       baseURL: 'https://api.newprovider.com/v1',
       timeout: 10000
     });
   }
   ```

2. **Data Normalization**
   ```typescript
   private normalizeNewProviderData(rawData: any): MarketData {
     return {
       size: rawData.market_size_usd,
       growth: rawData.cagr_percent / 100,
       segments: rawData.segments.map(s => ({
         name: s.segment_name,
         size: s.size_usd,
         growth: s.growth_rate / 100
       }))
     };
   }
   ```

3. **Error Handling**
   ```typescript
   try {
     const data = await this.newProvider.getMarketData(params);
     return this.normalizeNewProviderData(data);
   } catch (error) {
     if (error.status === 429) {
       throw new MCPError('RATE_LIMITED', 'API rate limit exceeded');
     }
     throw new MCPError('DATA_SOURCE_ERROR', 'Failed to fetch data', { error });
   }
   ```

## 🚦 Release Process

### Version Management

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Pre-release**
   - [ ] All tests passing
   - [ ] Code coverage ≥90%
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   - [ ] Version bumped in package.json

2. **Release**
   - [ ] Create release branch
   - [ ] Tag version: `git tag v1.2.3`
   - [ ] Push to GitHub
   - [ ] Create GitHub release
   - [ ] Deploy to staging
   - [ ] Deploy to production

3. **Post-release**
   - [ ] Monitor metrics
   - [ ] Update documentation site
   - [ ] Communicate changes to users

## 🐛 Bug Reports

### Reporting Issues

When reporting bugs, please include:

1. **Environment Information**
   - Node.js version
   - Operating system
   - Server version
   - Configuration details

2. **Steps to Reproduce**
   - Exact steps to trigger the issue
   - Input data used
   - Expected vs actual behavior

3. **Logs and Errors**
   - Server logs (redact sensitive info)
   - Error messages
   - Stack traces

4. **Additional Context**
   - Screenshots if applicable
   - Related issues or PRs
   - Potential solutions

### Issue Template

```markdown
## Bug Description
Brief description of the issue

## Environment
- Node.js: v18.x.x
- OS: Ubuntu 22.04
- Server Version: v1.0.0

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Logs
```
Error logs here
```

## Additional Context
Any other relevant information
```

## 📞 Getting Help

- **Documentation**: Check README.md and inline code comments
- **GitHub Issues**: Search existing issues before creating new ones
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: Request reviews on complex changes

## 🔧 Advanced Usage Guidelines

### Environment Setup and Configuration

#### 💻 Development Environment Requirements

**Required Software:**
- **Node.js**: 18.0.0 or higher (LTS recommended)
- **npm**: 8.0.0 or higher (comes with Node.js)
- **Git**: 2.30.0 or higher
- **TypeScript**: Knowledge of TypeScript 4.5+
- **VS Code**: Recommended (with extensions listed below)

**Environment Variables:**
```bash
# Copy and customize environment configuration
cp .env.example .env

# Required variables (add to .env)
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
MCP_SERVER_NAME=tam-mcp-server

# Optional performance tuning
CACHE_TTL=3600
MAX_CONCURRENT_TOOLS=5
REQUEST_TIMEOUT=30000

# Development features
ENABLE_DEBUG_LOGS=true
ENABLE_METRICS=true
ENABLE_NOTIFICATIONS=true
```

#### 🎯 IDE Configuration (VS Code)

**Recommended Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode", 
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer",
    "ms-vscode.vscode-json",
    "github.vscode-pull-request-github",
    "ms-vscode.vscode-github-issue-notebooks"
  ]
}
```

**VS Code Settings (`.vscode/settings.json`):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.validate": ["typescript", "javascript"],
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.nyc_output": true,
    "**/coverage": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  }
}
```

**Launch Configuration (`.vscode/launch.json`):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug TAM Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "Debug Tests",
      "type": "node", 
      "request": "launch",
      "program": "${workspaceFolder}/tests/run-tests.js",
      "args": ["unit", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Development Workflow Advanced Patterns

#### 🔄 Feature Development Lifecycle

**1. Planning Phase:**
```bash
# Research and planning
git checkout main
git pull origin main

# Review recent changes and architecture
cat doc/RELEASE-NOTES.md | head -50
grep -r "TODO\|FIXME" src/

# Create feature branch with descriptive name
git checkout -b feature/market-sentiment-analysis
```

**2. Development Phase:**
```bash
# Set up continuous testing
npm run test:unit -- --watch &

# Start development server with hot reload
npm run dev &

# Monitor logs in separate terminal
tail -f logs/combined.log | grep "market_sentiment"
```

**3. Testing and Quality Assurance:**
```bash
# Run comprehensive test suite
npm run test:all

# Check code coverage and identify gaps
npm run test:coverage
open coverage/lcov-report/index.html

# Lint and format code
npm run lint:fix
npm run format

# Performance testing
npm run test:performance
```

**4. Documentation and Review:**
```bash
# Update documentation
# 1. Add entry to doc/RELEASE-NOTES.md
# 2. Update README.md if needed
# 3. Add JSDoc comments to new functions

# Self-review checklist
git diff main --name-only
git diff main --stat
```

#### 🐛 Debugging Guidelines

**Server Debugging:**
```bash
# Debug server startup issues
DEBUG=tam:* npm run dev

# Debug specific tool execution
DEBUG=tam:tools:* npm run dev

# Debug notification system
DEBUG=tam:notifications:* npm run dev

# Debug database/cache issues  
DEBUG=tam:data:* npm run dev
```

**Test Debugging:**
```bash
# Debug failing tests with detailed output
npm run test:unit -- --verbose --detectOpenHandles

# Debug specific test file
npm run test:unit tests/unit/tools/market-tools.test.js -- --verbose

# Debug integration tests with network issues
npm run test:integration -- --detectOpenHandles --forceExit
```

**Performance Debugging:**
```bash
# Profile server performance
node --prof src/index.ts
node --prof-process isolate-*.log > profile.txt

# Memory leak detection
node --inspect src/index.ts
# Connect Chrome DevTools to analyze memory

# Benchmark tool performance
npm run benchmark:tools
```

#### 🔍 Troubleshooting Common Issues

**1. Server Won't Start:**
```bash
# Check port availability
lsof -i :3000

# Verify environment variables
printenv | grep -E "(NODE|MCP|PORT)"

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**2. Tests Failing:**
```bash
# Clear test cache
npm run test:clear-cache

# Check for hanging processes
ps aux | grep node

# Reset test database/fixtures
npm run test:reset-fixtures
```

**3. Tool Execution Issues:**
```bash
# Check tool registration
curl -X GET http://localhost:3000/mcp/tools/list

# Test tool directly
curl -X POST http://localhost:3000/mcp/tools/calculate_tam \
  -H "Content-Type: application/json" \
  -d '{"industry":"Technology","geography":"Global"}'

# Verify notification system
curl -X GET http://localhost:3000/sse/subscribe
```

**4. Build/Deployment Issues:**
```bash
# Clean build
npm run clean
npm run build

# Check TypeScript compilation
npx tsc --noEmit

# Verify production readiness
NODE_ENV=production npm start
```

### Advanced Contributor Workflows

#### 🚀 Continuous Integration Best Practices

**Pre-commit Hooks Setup:**
```bash
# Install husky for git hooks
npm install --save-dev husky

# Set up pre-commit hooks
npx husky add .husky/pre-commit "npm run lint && npm run test:unit"
npx husky add .husky/commit-msg "npx commitlint --edit"
```

**Local CI Simulation:**
```bash
# Simulate CI environment locally
docker run -v $(pwd):/app -w /app node:18 bash -c "
  npm ci &&
  npm run lint &&
  npm run test:ci &&
  npm run build
"
```

#### 📊 Monitoring and Analytics

**Performance Monitoring During Development:**
```typescript
// Add to development code for performance tracking
const startTime = performance.now();

// Your code here

const executionTime = performance.now() - startTime;
console.log(`Operation took ${executionTime.toFixed(2)}ms`);

// Log performance metrics
logger.metric('tool_execution_time', {
  tool: 'calculate_tam',
  duration: executionTime,
  industry: params.industry
});
```

**Memory Usage Monitoring:**
```bash
# Monitor memory usage during development
node --max-old-space-size=4096 --inspect src/index.ts

# Generate heap snapshots for analysis
node --inspect --heap-prof src/index.ts
```

#### 🔧 Custom Development Scripts

**Package.json Scripts for Advanced Development:**
```json
{
  "scripts": {
    "dev:debug": "NODE_ENV=development DEBUG=tam:* nodemon src/index.ts",
    "dev:profile": "node --prof --inspect src/index.ts",
    "test:watch:unit": "jest --watch tests/unit/",
    "test:watch:integration": "jest --watch tests/integration/",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "benchmark": "node scripts/benchmark.js",
    "analyze:bundle": "webpack-bundle-analyzer dist/",
    "check:security": "npm audit && snyk test",
    "check:updates": "ncu -u",
    "docs:generate": "typedoc --out docs src/",
    "clean:all": "rm -rf node_modules dist coverage .nyc_output logs/*.log"
  }
}
```

### Security Guidelines for Contributors

#### 🔒 Security Best Practices

**1. Secure Development Environment:**
```bash
# Use environment-specific configs
NODE_ENV=development # Never use production secrets in dev

# Encrypt sensitive files
gpg --encrypt --armor .env.production

# Use secure git practices
git config --global user.signingkey YOUR_GPG_KEY
git config --global commit.gpgsign true
```

**2. Code Security Checks:**
```bash
# Security audit before committing
npm audit --audit-level moderate

# Check for secrets in code
git diff --cached | grep -i "password\|secret\|key\|token"

# Use security linting
npm run lint:security
```

**3. Dependency Security:**
```bash
# Verify package integrity
npm ls --depth=0

# Check for known vulnerabilities
snyk test

# Update dependencies safely
npm update --dry-run
npm update
```

## 🏆 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors section
- Release notes for significant contributions
- Monthly contributor highlights

**Contributor Levels:**
- **🌟 First-time Contributors**: Welcome package and mentoring
- **🔥 Regular Contributors**: Recognition in release notes
- **💎 Core Contributors**: Listed in CONTRIBUTORS.md with special recognition
- **🏆 Maintainers**: Full commit access and decision-making authority

**Recognition Criteria:**
- **Quality**: Well-tested, documented contributions
- **Impact**: Features that significantly improve the project
- **Community**: Helping other contributors and users
- **Consistency**: Regular, reliable contributions over time

Thank you for contributing to the Market Sizing MCP Server! Your contributions help make market analysis more accessible and powerful for everyone. 🚀
