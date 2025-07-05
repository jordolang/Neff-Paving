# Create Dockerfile in root
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8001
CMD ["node", "backend/server-simple.js"]
