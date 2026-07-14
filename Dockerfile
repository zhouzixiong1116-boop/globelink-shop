FROM node:18-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies in backend directory
WORKDIR /app/backend
RUN npm install

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]