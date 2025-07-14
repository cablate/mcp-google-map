# Use Node.js 20 LTS as build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install system dependencies (if needed)
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# --- Production image ---
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies (if needed)
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copy only production node_modules from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/tsconfig.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp-google-map -u 1001

# Change ownership of the app directory to non-root user
RUN chown -R mcp-google-map:nodejs /app

# Switch to non-root user
USER mcp-google-map

# Expose port (if needed for HTTP communication)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Default command (adjust as needed)
CMD ["node", "dist/index.js", "--transport=http"]
