FROM node:20-alpine

WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of the files
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Start the app with host IP binding
CMD ["npm", "run", "dev", "--", "--host"]
