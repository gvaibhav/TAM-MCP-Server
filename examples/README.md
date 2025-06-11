# Examples and Integration Testing

This directory contains examples and resources for testing and integrating with the TAM MCP Server.

## 📄 Postman Collection

### `TAM-MCP-Server-Postman-Collection.json`

A comprehensive Postman collection for testing all aspects of the TAM MCP Server API.

#### Features
- **Health Check**: Server status and availability testing
- **Session Management**: MCP session initialization and cleanup
- **Tool Testing**: All 11 market analysis tools with sample requests
- **Resource Access**: Documentation and endpoint access
- **Error Handling**: Edge cases and error scenarios
- **Performance Testing**: Response time monitoring

#### Setup Instructions

1. **Import Collection**
   - Open Postman
   - Import `TAM-MCP-Server-Postman-Collection.json`

2. **Set Environment Variables**
   ```json
   {
     "serverUrl": "http://localhost:3000",
     "sessionId": "(automatically set after initialization)"
   }
   ```

3. **Start Server**
   ```bash
   npm run start:http  # or npm run start:sse
   ```

4. **Run Tests**
   - Use collection runner for automated testing
   - Run individual requests for manual testing
   - Monitor response times and data quality

#### Available Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| Health | `/health` | Server status check |
| Session | `/initialize` | Start MCP session |
| Tools | `/tools/list` | List available tools |
| Tools | `/tools/call` | Execute specific tool |
| Resources | `/resources/list` | List documentation resources |
| Cleanup | `/session/close` | End MCP session |

#### Tool Coverage

The collection includes test requests for all 11 market analysis tools:

1. `industry_search` - Find industries by keywords
2. `industry_data` - Get detailed industry information
3. `market_size` - Retrieve market size data
4. `tam_calculator` - Calculate Total Addressable Market
5. `sam_calculator` - Calculate Serviceable Markets
6. `market_segments` - Analyze market segmentation
7. `market_forecasting` - Generate market forecasts
8. `market_comparison` - Compare multiple markets
9. `data_validation` - Validate data quality
10. `market_opportunities` - Identify opportunities
11. `generic_data_query` - Direct data source access

#### Response Validation

Each request includes tests for:
- HTTP status codes
- Response structure validation
- Data quality checks
- Performance benchmarks
- Error handling verification

## 🚀 Usage Examples

### Quick API Test
```bash
# Start server
npm run start:http

# Import Postman collection
# Run "Health Check" request
# Run "Initialize Session" request
# Try any tool request
```

### Automated Testing
```bash
# Use Postman CLI or Newman
newman run TAM-MCP-Server-Postman-Collection.json \
  --environment your-environment.json \
  --reporters cli,junit,html
```

### Integration Examples
- Connect from Claude Desktop with MCP configuration
- Use with MCP Inspector for protocol debugging
- Integrate with custom MCP clients

---

For more examples and integration guides, see the [main documentation](../doc/README.md).
