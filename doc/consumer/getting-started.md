# Getting Started with TAM MCP Server

Welcome! This guide will help you get the TAM MCP Server up and running quickly.

## 🎯 What is TAM MCP Server?

The TAM (Total Addressable Market) MCP Server is a Model Context Protocol server that provides:
- **Market Analysis Tools** - Industry research, market sizing, TAM/SAM calculations
- **Multiple Data Sources** - Alpha Vantage, FRED, World Bank, IMF, OECD, BLS, Census, Nasdaq
- **Real-time APIs** - RESTful APIs and MCP protocol support
- **Professional Tools** - 17 market analysis tools for business intelligence

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **API Keys** (optional but recommended):
  - Alpha Vantage API key
  - FRED API key
  - Other data source API keys as needed

## ⚡ Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/TAM-MCP-Server.git
cd TAM-MCP-Server

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Basic Configuration

Create a `.env` file in the project root:

```env
# Basic configuration
PORT=3000
NODE_ENV=development

# Optional: API Keys for enhanced functionality
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FRED_API_KEY=your_fred_key
```

### 3. Start the Server

```bash
# Start with default settings
npm start

# Or start with specific transport
npm run start:stdio    # STDIO transport
npm run start:sse      # SSE transport  
npm run start:http     # HTTP transport
```

### 4. Verify Installation

Visit `http://localhost:3000/health` to check server status.

## 🔧 Basic Usage

### Using with MCP Clients

Configure your MCP client to connect to:
- **STDIO**: Direct process communication
- **SSE**: `http://localhost:3000/sse`
- **HTTP**: `http://localhost:3000/mcp`

### Example: Industry Search

```javascript
// Using the industrySearch tool
const result = await client.callTool('industrySearch', {
  query: 'artificial intelligence',
  limit: 10,
  includeSubIndustries: true
});
```

### Example: Market Size Analysis

```javascript
// Using the marketSize tool
const marketData = await client.callTool('marketSize', {
  industry: 'AI software',
  region: 'North America',
  year: 2024
});
```

## 🌐 Available Tools

The server provides 17 market analysis tools:

**Core Tools:**
- `industrySearch` - Search for industries
- `industryData` - Get detailed industry information
- `marketSize` - Calculate market size
- `tamCalculator` - Total Addressable Market calculations
- `samCalculator` - Serviceable Addressable Market calculations

**Advanced Tools:**
- `marketSegments` - Market segmentation analysis
- `marketForecasting` - Predictive market analysis
- `marketComparison` - Compare multiple markets
- `dataValidation` - Validate market data
- `marketOpportunities` - Identify market opportunities
- `generic_data_query` - Flexible data queries

**Data Source Tools:**
- Individual tools for Alpha Vantage, FRED, World Bank, IMF, OECD, BLS, Census, Nasdaq

## 📚 Next Steps

1. **Explore Examples**: Check out [Examples & Tutorials](examples.md)
2. **API Reference**: Review the complete [API Reference](api-reference.md)
3. **Configuration**: Advanced setup in [Configuration Guide](configuration.md)
4. **Integration**: Connect your client with [MCP Client Integration](mcp-integration.md)

## 💡 Need Help?

- **Common Issues**: [FAQ & Troubleshooting](faq.md)
- **Test APIs**: [Postman Collections](postman-guide.md)
- **Full Documentation**: [Main Documentation](../README.md)

---

**Ready to dive deeper?** Continue with [Examples & Tutorials](examples.md) for hands-on examples.
