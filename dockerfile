# Use Node 18 (LTS)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose app port
EXPOSE 3000

# Run development
CMD ["npm", "run", "dev"]

ENV CHOKIDAR_USEPOLLING=true
