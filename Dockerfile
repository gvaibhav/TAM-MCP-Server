# TAM MCP Server Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDeps needed for build).
# --ignore-scripts skips the "prepare" lifecycle hook which runs tsc before sources are copied.
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Remove devDependencies after build for a lean image
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Health check against the /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server in HTTP (Streamable HTTP) transport mode
# This exposes /health and /mcp over HTTP - suitable for Docker/networked use
CMD ["node", "dist/index.js", "http"]
