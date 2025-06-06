# Contributing to Market Sizing MCP Server

Thank you for your interest in contributing to the Market Sizing MCP Server! This document provides guidelines and information for contributors.

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

## 🏆 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors section
- Release notes for significant contributions
- Monthly contributor highlights

Thank you for contributing to the Market Sizing MCP Server! Your contributions help make market analysis more accessible and powerful for everyone. 🚀
