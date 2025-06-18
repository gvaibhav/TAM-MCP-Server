# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in the TAM MCP Server, please report it responsibly:

1. **Do not open a public issue** for security vulnerabilities
2. **Email**: Please send details to the project maintainers
3. **Include**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (if any)

## Security Best Practices

When using the TAM MCP Server:

- **API Keys**: Always store API keys securely using environment variables
- **Network**: Use HTTPS in production environments
- **Access Control**: Implement proper authentication for MCP clients
- **Updates**: Keep dependencies updated to latest secure versions
- **Monitoring**: Monitor logs for unusual activity

## Security Features

The server includes:

- Input validation using Zod schemas
- Rate limiting protection
- Structured error handling without sensitive data exposure
- Secure environment variable handling

Thank you for helping keep the TAM MCP Server secure.
