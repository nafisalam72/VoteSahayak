# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM gcr.io/distroless/nodejs22-debian12 AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy production dependencies
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/server ./src/server
COPY server.js ./server.js

EXPOSE 8080
USER 1000
CMD ["server.js"]
