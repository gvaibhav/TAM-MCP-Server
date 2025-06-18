# Contributing to TAM MCP Server

Thank you for your interest in contributing to the TAM (Total Addressable Market) MCP Server! This document provides guidelines and information for contributors.

## Before You Submit

Before submitting any pull request, please ensure you follow these essential requirements:

### 1. Run Tests and Lint

Always run tests and lint checks before submitting code:

```bash
# Run all tests (must pass)
npm test

# Run ESLint (must have no errors)
npm run lint

# Build the project (must succeed)
npm run build
```

All tests must pass and there should be no ESLint errors. ESLint warnings are acceptable but should be minimized.

### 2. Update Design Documentation

If your changes affect the system architecture, design, or add new features:

- Update relevant documentation in the `doc/` directory
- Add or update architectural diagrams if applicable
- Update API documentation for any new tools or endpoints
- Ensure your changes align with the existing design patterns

### 3. Project Organization Rules

Follow these strict organizational rules:

#### Do NOT leave logs in project root
- Never commit log files to the project root directory
- Use `.gitignore` to exclude log files (`*.log`, `logs/`, etc.)
- If you need to include sample logs for documentation, place them in appropriate subdirectories

#### Move reports to the report folder
- All documentation should follow the established structure in the `doc/` directory
- Do not leave temporary reports or generated files in the root or source directories
- Name reports with clear, descriptive filenames and include dates when relevant

### 4. Code Quality Standards

- Follow TypeScript best practices
- Use proper error handling and logging
- Add appropriate tests for new functionality
- Maintain consistent code formatting (Prettier is configured)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### 5. Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd TAM-MCP-Server

# Install dependencies
npm install

# Set up development environment
npm run dev-setup

# Run in development mode
npm run dev
```

## Contribution Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes following the guidelines above
4. Run tests and lint: `npm test && npm run lint`
5. Update documentation as needed
6. Commit your changes with clear, descriptive messages
7. Push to your fork and submit a pull request

## Code of Conduct

- Be respectful and constructive in all interactions
- Follow the existing code patterns and conventions
- Test your changes thoroughly
- Document your work clearly
- Help maintain the high quality of the codebase

## Types of Contributions

We welcome:
- Bug fixes
- New data source integrations
- Performance improvements
- Documentation improvements
- Test coverage enhancements
- Tool enhancements and new market analysis features

## Questions?

If you have questions about contributing:
- Check the documentation in the `doc/` directory
- Look at existing code for patterns and examples
- Open an issue for discussion before making large changes
- Review recent pull requests for contribution examples

Thank you for helping make TAM-MCP-Server better!
