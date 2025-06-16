# MCP Client Integration

## Overview

The TAM MCP Server implements the Model Context Protocol (MCP) for seamless integration with AI models and applications.

## Supported Transports

### 1. STDIO Transport (Recommended)
Best for direct integration with MCP clients like Claude Desktop.

```json
{
  "mcpServers": {
    "tam-server": {
      "command": "npx",
      "args": ["@gvaibhav/tam-mcp-server"]
    }
  }
}
```

### 2. HTTP Transport
For web applications and REST API integrations.

```bash
# Start HTTP server
npm run start:http

# Access at http://localhost:3000
```

### 3. Server-Sent Events (SSE)
For real-time streaming applications.

```bash
# Start SSE server  
npm run start:sse

# Connect to real-time events
```

## MCP Protocol Features

### Tools (28 available)
- **17 Data Access Tools**: Raw data from external APIs
- **11 Business Analysis Tools**: Advanced market calculations

### Prompts (15 available) ⭐ **NEW**
Professional business analysis templates organized in three categories:
- **Strategic Business Analysis** (5 prompts): Startup funding, PE research, corporate strategy, VC thesis, asset management
- **Crisis & Specialized Analysis** (5 prompts): Crisis management, regulatory impact, international expansion, technology disruption, ESG analysis  
- **Quick Analysis & Guidance** (5 prompts): Market opportunity scan, competitive intelligence, investment screening, tool guidance, best practices

### Resources (3 available)
- Server health monitoring
- Configuration status
- API connectivity status

### Notifications
Real-time updates for:
- Market data changes
- Calculation completions  
- System status changes

## Client Examples

### Claude Desktop Integration
Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "tam-mcp-server": {
      "command": "node",
      "args": ["/path/to/tam-mcp-server/dist/index.js"],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "your_key_here",
        "FRED_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Custom Client Integration
See the [MCP SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk) for building custom clients.

## Testing Integration

Use the provided Postman collections to test MCP functionality:
- [Postman Guide](postman-guide.md)
- [Environment Setup](postman-environments-guide.md)
- [Test Automation](postman-automation-guide.md)

## Troubleshooting

Common integration issues:
- Transport configuration problems
- Authentication failures
- Protocol version mismatches
- Network connectivity issues

For support, see [FAQ & Troubleshooting](faq.md).
