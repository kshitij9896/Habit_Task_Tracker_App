# Use official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production

# Set working directory inside container
WORKDIR /app

# Copy package manifests first for optimal layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY --chown=node:node . .

# Use non-root node user provided by the official Node Alpine image
USER node

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
