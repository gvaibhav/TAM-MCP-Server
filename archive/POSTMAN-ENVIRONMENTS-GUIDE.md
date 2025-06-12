# Postman Environment Setup Guide

This guide explains how to set up and use the different Postman environments for testing the TAM MCP Server's backend API integrations.

## 📋 Available Environments

| Environment | File | Purpose | API Key Requirements |
|-------------|------|---------|---------------------|
| **Default** | `tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json` | General testing | Optional (all APIs) |
| **Development** | `tests/postman/environments/TAM-MCP-Server-Development.postman_environment.json` | Development testing | Demo/limited keys |
| **Staging** | `tests/postman/environments/TAM-MCP-Server-Staging.postman_environment.json` | Pre-production testing | Separate staging keys |
| **Production** | `tests/postman/environments/TAM-MCP-Server-Production.postman_environment.json` | Production monitoring | Production keys |

## 🚀 Quick Setup

### 1. Import Collection and Environments

1. **Open Postman**
2. **Import Collection**: 
   - File → Import → `TAM-MCP-Server-Postman-Collection.json`
3. **Import All Environments**:
   - Import each environment file from the project root
   - Select the appropriate environment from the dropdown

### 2. Configure API Keys by Environment

#### **Development Environment**
- Use demo keys or free tier limits
- Test with minimal quota usage
- Slower request delays for API friendliness

```bash
# Example development .env
ALPHA_VANTAGE_API_KEY=demo_key_or_free_tier
FRED_API_KEY=your_development_fred_key
# ... other keys
```

#### **Staging Environment** 
- Use separate API keys from production
- Test with realistic data volumes
- Moderate request delays

#### **Production Environment**
- Use production API keys
- Conservative request delays
- Full monitoring enabled

## 🔧 Environment-Specific Features

### **Development Environment Variables**
- `test_symbol`: MSFT (Microsoft for development)
- `request_delay`: 1000ms (1 second between requests)
- `timeout`: 10000ms (10 second timeout)

### **Staging Environment Variables**
- `test_symbol`: AAPL (Apple for staging)
- `test_country_code`: CA (Canada for international testing)
- `request_delay`: 2000ms (2 seconds between requests)
- `timeout`: 15000ms (15 second timeout)

### **Production Environment Variables**
- `test_symbol`: GOOGL (Google for production monitoring)
- `test_country_code`: GB (UK for global testing)
- `request_delay`: 3000ms (3 seconds - conservative)
- `timeout`: 20000ms (20 second timeout)
- `monitoring_enabled`: true

## 📊 Testing Workflows by Environment

### **Development Workflow**
1. **Quick Health Check**: Test API connectivity
2. **Single API Tests**: Test individual services
3. **Error Scenarios**: Test with invalid keys/parameters
4. **Rate Limit Testing**: Test behavior with quota limits

### **Staging Workflow**  
1. **Full API Suite**: Test all APIs with realistic data
2. **Integration Scenarios**: Test complete workflows
3. **Performance Testing**: Monitor response times
4. **Cross-Service Validation**: Verify data consistency

### **Production Workflow**
1. **Health Monitoring**: Regular service availability checks
2. **Sample Data Validation**: Spot check data quality
3. **Performance Monitoring**: Track API response times
4. **Quota Monitoring**: Monitor API usage limits

## 🔍 Newman CLI Usage by Environment

### Run with Specific Environment
```bash
# Development testing
newman run TAM-MCP-Server-Postman-Collection.json \
  -e TAM-MCP-Server-Development.postman_environment.json \
  --folder "Health Checks"

# Staging testing  
newman run TAM-MCP-Server-Postman-Collection.json \
  -e TAM-MCP-Server-Staging.postman_environment.json \
  --folder "Premium APIs"

# Production monitoring
newman run TAM-MCP-Server-Postman-Collection.json \
  -e TAM-MCP-Server-Production.postman_environment.json \
  --folder "Health Checks" \
  --delay-request 5000
```

### Environment-Specific CI/CD
```yaml
# GitHub Actions example
- name: Run Development Tests
  run: |
    newman run TAM-MCP-Server-Postman-Collection.json \
      -e TAM-MCP-Server-Development.postman_environment.json \
      --bail
      
- name: Run Production Health Check
  run: |
    newman run TAM-MCP-Server-Postman-Collection.json \
      -e TAM-MCP-Server-Production.postman_environment.json \
      --folder "Health Checks" \
      --delay-request 5000
```

## 🎯 Best Practices

### **API Key Management**
- **Development**: Use free tier or demo keys
- **Staging**: Use separate keys from production
- **Production**: Use dedicated production keys with monitoring

### **Request Timing**
- **Development**: Fast testing (1s delays)
- **Staging**: Realistic timing (2s delays)  
- **Production**: Conservative timing (3s+ delays)

### **Test Scope**
- **Development**: Focus on functionality and error handling
- **Staging**: Full integration and performance testing
- **Production**: Health checks and monitoring only

### **Data Validation**
- **Development**: Test with known good/bad data
- **Staging**: Test with production-like data volumes
- **Production**: Validate actual production data quality

## 📈 Monitoring Setup

### **Development Monitoring**
- Focus on API connectivity
- Track error rates during development
- Monitor quota usage for free tiers

### **Staging Monitoring**  
- Performance benchmarking
- Integration test success rates
- Data quality validation

### **Production Monitoring**
- Service availability (uptime)
- Response time trends
- API quota utilization
- Data freshness validation

## 🚨 Troubleshooting

### **Common Issues by Environment**

#### Development
- **Free tier limits**: Use delays and monitor quotas
- **Demo data**: Some APIs may return demo/cached data
- **Network issues**: Local development network restrictions

#### Staging
- **Key conflicts**: Ensure staging keys are separate from production
- **Data differences**: Staging data may differ from production
- **Performance variations**: Staging infrastructure differences

#### Production
- **Rate limiting**: Production systems may have stricter limits
- **Data sensitivity**: Be careful with production data access
- **Monitoring overhead**: Production monitoring may impact performance

### **Error Resolution**
1. **Check environment selection** in Postman dropdown
2. **Verify API keys** are configured for the selected environment
3. **Review request delays** appropriate for environment
4. **Check service-specific quotas** and limits
5. **Validate base URLs** and endpoint configurations

## 📝 Environment Customization

### **Adding Custom Variables**
You can add environment-specific variables for your use case:

```json
{
  "key": "custom_industry_code",
  "value": "your_industry_specific_value",
  "description": "Custom industry code for your testing",
  "enabled": true,
  "type": "default"
}
```

### **Server URL Configuration**
Update server URLs for different deployment environments:

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.yourcompany.com`  
- **Production**: `https://api.yourcompany.com`

---

For questions or issues with environment setup, please refer to the main [Backend API Testing Guide](doc/BACKEND-API-TESTING.md) or create an issue on GitHub.
