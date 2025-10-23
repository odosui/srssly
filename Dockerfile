# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm ci

# Copy client package files
COPY client/package*.json ./client/

# Install client dependencies
RUN cd client && npm ci

# Copy source code
COPY . .

# Build both server and client
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies and tsx for running scripts
RUN npm ci --only=production && \
    npm install -g tsx && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Create an entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# Default command (start the application)
CMD ["start"]
