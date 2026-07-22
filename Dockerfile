FROM node:20-slim

WORKDIR /app

# Install system dependencies for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
COPY package*.json ./
RUN npm install --production

# Copy all files
COPY . .

# Create data directories
RUN mkdir -p /app/data /app/uploads

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]