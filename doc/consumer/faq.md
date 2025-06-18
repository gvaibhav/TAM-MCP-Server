# FAQ & Troubleshooting

## Frequently Asked Questions

### Getting Started

**Q: What API keys do I need?**
A: See the [Getting API Keys](getting-api-keys.md) guide. Most functionality works with free tier keys from Alpha Vantage, FRED, and World Bank.

**Q: How do I test if the server is working?**
A: Use the [Postman collections](postman-guide.md) or run the health check tools via MCP.

**Q: Can I use this without API keys?**
A: Limited functionality is available with cached/demo data, but API keys are recommended for full features.

### Integration Issues

**Q: MCP client can't connect to the server**
A: Check that:
- Server is running on the correct transport (STDIO/HTTP/SSE)
- Environment variables are set correctly
- Network ports are available (for HTTP/SSE)

**Q: Tools return "API key not configured" errors**
A: Verify your `.env` file has the required API keys and the server was restarted after adding them.

**Q: Getting rate limit errors**
A: Most APIs have rate limits. The server includes built-in rate limiting, but you may need to:
- Use production API keys instead of free tier
- Reduce request frequency
- Implement caching (Redis recommended)

### Performance Issues

**Q: Responses are slow**
A: Try:
- Enable Redis caching for better performance
- Use closer geographic API endpoints
- Check your internet connection
- Verify API service status

**Q: High memory usage**
A: Consider:
- Enabling Redis for external caching
- Reducing cache size in configuration
- Using HTTP transport instead of keeping server in memory

### Data Quality

**Q: Getting unexpected or old data**
A: Check:
- API service status and data freshness
- Your API subscription level (free vs paid)
- Cache settings (may be serving cached data)
- Parameter formatting (dates, regions, etc.)

**Q: Different tools return different values for the same query**
A: This is normal - different data sources may have:
- Different methodologies
- Different update frequencies  
- Different geographic coverage
- Different data definitions

## Common Error Messages

### "Service temporarily unavailable"
- **Cause**: External API is down or rate limited
- **Solution**: Wait and retry, check API service status

### "Invalid API key"
- **Cause**: Missing, incorrect, or expired API key
- **Solution**: Verify API key in `.env` file, check expiration

### "Rate limit exceeded"
- **Cause**: Too many requests to external API
- **Solution**: Implement delays, use caching, upgrade API plan

### "Data not found"
- **Cause**: Requested data doesn't exist or parameters are incorrect
- **Solution**: Verify parameter format, try alternative parameters

### "Network timeout"
- **Cause**: Slow network or API response
- **Solution**: Check connection, increase timeout settings

## Getting Help

### Documentation
- [Getting Started](getting-started.md) - Basic setup
- [Configuration Guide](configuration.md) - Advanced setup
- [Tool Usage Guide](tools-guide.md) - Tool reference

### Testing Resources
- [Postman Collections](postman-guide.md) - API testing
- [Examples](examples.md) - Usage examples  

### Support
- Check the [GitHub Issues](https://github.com/gvaibhav/TAM-MCP-Server/issues) for known issues
- Review the [Contributing Guide](../../CONTRIBUTING.md) for bug reports
- See the main [README](../../README.md) for project overview

## Still Having Issues?

If you're still experiencing problems:

1. **Check the logs** - Enable debug logging to see detailed error messages
2. **Test with Postman** - Use the provided collections to isolate the issue
3. **Verify configuration** - Double-check API keys and environment setup
4. **Check external services** - Verify the external APIs are working independently
5. **Create an issue** - If none of the above helps, create a GitHub issue with:
   - Error messages and logs
   - Steps to reproduce
   - Your configuration (without API keys)
   - Operating system and Node.js version
