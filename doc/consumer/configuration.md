# Configuration Guide

## Environment Setup

### Required API Keys
See the [Getting API Keys](getting-api-keys.md) guide for detailed instructions on obtaining:

- Alpha Vantage API Key (financial data)
- FRED API Key (economic data) 
- World Bank API access (development data)
- Census Bureau API Key (demographic data)
- And others as needed

### Environment Configuration

#### 1. Local Development Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit with your API keys
nano .env
```

#### 2. Docker Deployment
```bash
# Build and run with Docker
docker build -t tam-mcp-server .
docker run -p 3000:3000 --env-file .env tam-mcp-server
```

#### 3. Production Setup
See the [Deployment Guide](../../DEPLOYMENT-GUIDE.md) for production configuration.

## Transport Options

### STDIO (Default for MCP Clients)
```bash
# Direct MCP client integration
tam-mcp-server
```

### HTTP Server
```bash
# Web API access
npm run start:http
```

### Server-Sent Events (SSE)
```bash
# Real-time streaming
npm run start:sse
```

## Advanced Configuration

### Caching Options
- **Memory Caching**: Default for development
- **Redis Caching**: Recommended for production
- **Hybrid Caching**: Memory + Redis for optimal performance

### Rate Limiting
Configure API request limits to respect external service quotas.

### Logging
Structured logging with configurable levels for debugging and monitoring.

## Troubleshooting

Common configuration issues and solutions:
- API key validation failures
- Network connectivity issues  
- Rate limiting problems
- Cache configuration errors

For detailed troubleshooting, see [FAQ & Troubleshooting](faq.md).
