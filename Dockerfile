FROM node:20-alpine

WORKDIR /app

# Install dependencies
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