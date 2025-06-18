# Examples & Tutorials

## 📋 Available Resources

### Postman Collections
- **[Main Postman Collection](../../examples/README.md)** - Complete API testing collection
- **[Environment Setup](postman-environments-guide.md)** - Multi-environment configuration
- **[Advanced Automation](postman-automation-guide.md)** - Automated testing workflows

### Usage Scenarios

#### 1. Market Research Workflow
1. Use **industry search** tools to find relevant sectors
2. Apply **market size** tools to get current market data
3. Run **TAM calculator** for total addressable market
4. Use **forecasting** tools for future projections

#### 2. Competitive Analysis
1. Gather **company financial** data via Alpha Vantage tools
2. Compare with **industry benchmarks** using market analysis tools
3. Analyze **market segments** for positioning insights

#### 3. Investment Research
1. Pull **economic indicators** using FRED tools
2. Get **company fundamentals** via financial data tools
3. Calculate **market opportunity** using TAM/SAM tools

## 🎯 Quick Start Examples

### Basic Market Data Query
```bash
# Use MCP tools to get market size for software industry
{
  "tool": "market_size",
  "params": {
    "industryId": "software-saas", 
    "region": "global"
  }
}
```

### TAM Calculation
```bash
# Calculate Total Addressable Market
{
  "tool": "tam_analysis",
  "params": {
    "industryId": "cloud-computing",
    "region": "US", 
    "includeScenarios": true
  }
}
```

## 📚 Learn More
- [Getting Started](getting-started.md) - Installation and setup
- [Tool Usage Guide](tools-guide.md) - Complete tool reference
- [API Reference](api-reference.md) - Technical documentation
