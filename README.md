# Market Sizing MCP Server

[![GitHub stars](https://img.shields.io/github/stars/gvaibhav/TAM-MCP-Server?style=social)](https://github.com/gvaibhav/TAM-MCP-Server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/gvaibhav/TAM-MCP-Server?style=social)](https://github.com/gvaibhav/TAM-MCP-Server/network)
[![GitHub issues](https://img.shields.io/github/issues/gvaibhav/TAM-MCP-Server)](https://github.com/gvaibhav/TAM-MCP-Server/issues)
[![GitHub license](https://img.shields.io/github/license/gvaibhav/TAM-MCP-Server)](https://github.com/gvaibhav/TAM-MCP-Server/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io/)

A comprehensive **Model Context Protocol (MCP)** server for market sizing analysis, TAM/SAM calculations, and industry research. Built with TypeScript, Express.js, and following the MCP 2024-11-05 specification.

## 🚀 Features

### Core Capabilities
- **10 Specialized Market Analysis Tools** for comprehensive market research
- **HTTP Streamable Transport** with Server-Sent Events for real-time updates
- **Advanced Caching System** with configurable TTL and performance optimization
- **Comprehensive Logging** with structured Winston logging and business metrics
- **Prometheus Metrics** for monitoring and observability
- **Enterprise Security** with rate limiting, CORS, and input validation
- **Session Management** for stateful interactions

### Market Analysis Tools

1. **🔍 Industry Search** - Find and explore industry sectors and categories
2. **📊 Industry Data** - Get detailed industry statistics and metrics
3. **📈 Market Size** - Calculate current market size with multiple methodologies
4. **🎯 TAM Calculator** - Total Addressable Market analysis and calculations
5. **🎪 SAM Calculator** - Serviceable Addressable Market segmentation
6. **🧩 Market Segments** - Detailed market segmentation analysis
7. **📊 Market Forecasting** - Future market projections and trend analysis
8. **⚖️ Market Comparison** - Compare multiple markets and industries
9. **✅ Data Validation** - Validate and verify market data accuracy
10. **💡 Market Opportunities** - Identify growth opportunities and market gaps

## 🛠 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- TypeScript 5+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/gvaibhav/TAM-MCP-Server.git
cd TAM-MCP-Server

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit configuration (add your API keys)
nano .env

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

### Docker Installation

```bash
# Build Docker image
docker build -t tam-mcp-server .

# Run with Docker Compose
docker-compose up -d

# Or run standalone
docker run -p 3000:3000 -e NODE_ENV=production tam-mcp-server
```

## 📋 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `NODE_ENV` | Environment | `development` | No |
| `CORS_ORIGIN` | CORS origin | `*` | No |
| `RATE_LIMIT_MAX` | Rate limit per window | `100` | No |
| `CACHE_TTL` | Cache TTL (seconds) | `300` | No |
| `SESSION_SECRET` | Session secret key | - | **Yes** |
| `MARKET_DATA_API_KEY` | Market data provider API key | - | Recommended |
| `LOG_LEVEL` | Logging level | `info` | No |

### API Keys Configuration

The server supports multiple market data providers:

- **IBISWorld** - Industry reports and analysis
- **Statista** - Market statistics and data
- **Grand View Research** - Market research reports  
- **Bloomberg** - Financial and market data
- **PitchBook** - Private market data

Add your API keys to the `.env` file to enable real data integration.

## 🚦 API Endpoints

### MCP Protocol Endpoints

- `GET /mcp/discovery` - Server capabilities and tool discovery
- `POST /mcp/session` - Create and manage MCP sessions
- `POST /mcp/tools/{tool_name}` - Execute specific market analysis tools
- `GET /mcp/events` - Server-Sent Events stream for real-time updates
- `GET /mcp/health` - Health check and server status
- `GET /mcp/metrics` - Prometheus metrics endpoint

### Tool Execution Examples

```bash
# Search for industries
curl -X POST http://localhost:3000/mcp/tools/industry_search \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "filters": {"region": "global"}}'

# Calculate TAM
curl -X POST http://localhost:3000/mcp/tools/calculate_tam \
  -H "Content-Type: application/json" \
  -d '{"industry": "SaaS", "geography": "North America", "timeframe": "2024"}'

# Get market forecast
curl -X POST http://localhost:3000/mcp/tools/forecast_market \
  -H "Content-Type: application/json" \
  -d '{"industry": "Cloud Computing", "years": 5, "methodology": "compound_growth"}'
```

## 🏗 Architecture

### Project Structure

```
src/
├── index.ts              # Main entry point
├── server.ts             # Express server setup
├── types/
│   └── schemas.ts        # Zod schemas and TypeScript types
├── tools/
│   └── mcpTools.ts       # MCP tool implementations
├── services/
│   ├── dataService.ts    # Data operations and API integrations
│   └── cacheService.ts   # Caching service with NodeCache
└── utils/
    └── logger.ts         # Winston logging utility
```

### Technology Stack

- **Runtime**: Node.js 18+ with ES modules
- **Framework**: Express.js with TypeScript
- **Validation**: Zod for runtime type safety
- **Caching**: NodeCache with TTL support
- **Logging**: Winston with structured logging
- **Metrics**: Prometheus client for monitoring
- **Security**: Helmet, CORS, rate limiting
- **Transport**: HTTP with Server-Sent Events

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "MCPTools"

# Run integration tests
npm run test:integration
```

### Test Structure

- **Unit Tests** - Individual component testing
- **Integration Tests** - API endpoint testing  
- **Performance Tests** - Load and stress testing
- **Security Tests** - Vulnerability scanning

## 📊 Monitoring & Observability

### Prometheus Metrics

The server exposes comprehensive metrics at `/mcp/metrics`:

- **Request Metrics** - Request count, duration, status codes
- **Tool Metrics** - Tool execution time and success rates
- **Cache Metrics** - Hit/miss ratios and performance
- **Business Metrics** - Market analysis usage patterns
- **System Metrics** - Memory, CPU, and resource usage

### Logging

Structured JSON logging with multiple levels:

```typescript
// Business metrics logging
logger.business('market_analysis_completed', {
  tool: 'calculate_tam',
  industry: 'SaaS',
  result_size: 1234567890,
  execution_time: 1250
});

// Performance profiling
logger.profile('api_request', requestId);
// ... operation ...
logger.profile('api_request', requestId); // Logs duration
```

## 🔒 Security

### Security Features

- **Rate Limiting** - Configurable per-IP request limits
- **Input Validation** - Zod schema validation for all inputs
- **CORS Protection** - Configurable cross-origin policies
- **Security Headers** - Helmet.js security headers
- **Session Management** - Secure session handling
- **API Key Management** - Secure API key storage and rotation

### Production Security Checklist

- [ ] Change default `SESSION_SECRET`
- [ ] Configure specific `CORS_ORIGIN`
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable security monitoring
- [ ] Set up log aggregation
- [ ] Configure backup and recovery

## 🚀 Deployment

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  market-sizing-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secure-secret
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-sizing-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: market-sizing-mcp
  template:
    metadata:
      labels:
        app: market-sizing-mcp
    spec:
      containers:
      - name: market-sizing-mcp
        image: market-sizing-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

### Cloud Deployment

- **AWS**: ECS, Lambda, or EC2 with Application Load Balancer
- **Google Cloud**: Cloud Run, GKE, or Compute Engine
- **Azure**: Container Instances, AKS, or App Service
- **Heroku**: Direct deployment with buildpack

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run linting: `npm run lint:fix`
5. Run tests: `npm test`
6. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
7. Push and create a Pull Request

### Code Standards

- **TypeScript** with strict mode enabled
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **100% test coverage** for new features

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/gvaibhav/TAM-MCP-Server/wiki)
- **Issues**: [GitHub Issues](https://github.com/gvaibhav/TAM-MCP-Server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gvaibhav/TAM-MCP-Server/discussions)
- **Author**: [@gvaibhav](https://github.com/gvaibhav)

## 🙏 Acknowledgments

- **Model Context Protocol** specification by Anthropic
- **Market Research Community** for methodology guidance  
- **Open Source Contributors** who made this project possible

---

**Created by [Gvaibhav](https://github.com/gvaibhav) with ❤️ for the market research and business intelligence community**
