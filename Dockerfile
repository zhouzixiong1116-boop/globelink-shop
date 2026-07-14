FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package.json backend/
RUN npm install

# Copy all other files
COPY . .

EXPOSE 3000

CMD ["sh", "-c", "cd backend && node server.js"]