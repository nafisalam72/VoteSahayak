# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for building
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts and server source
COPY --from=builder /app/dist ./dist
COPY . .

# Expose port and run
EXPOSE 8080
CMD ["node", "server.js"]
