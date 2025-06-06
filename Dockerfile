# Use official Node.js runtime as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci --include=dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/src ./src
COPY --chown=nodejs:nodejs .env.example .env

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/mcp/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the application
CMD ["npm", "start"]

# Metadata
LABEL maintainer="TAM-MCP-Server Team <support@tam-mcp-server.com>"
LABEL version="1.0.0"
LABEL description="Market Sizing MCP Server for TAM/SAM calculations and industry analysis"
LABEL org.opencontainers.image.title="Market Sizing MCP Server"
LABEL org.opencontainers.image.description="Comprehensive MCP server for market analysis and TAM/SAM calculations"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="TAM-MCP-Server Team"
LABEL org.opencontainers.image.url="https://github.com/tam-mcp-server/market-sizing-mcp"
LABEL org.opencontainers.image.source="https://github.com/tam-mcp-server/market-sizing-mcp"
LABEL org.opencontainers.image.licenses="MIT"
