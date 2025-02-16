# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock) into the container
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code into the container
COPY . .

# Set environment variables if needed (e.g. Firebase config)
# ENV NEXT_PUBLIC_reelURL=<your-reel-url>
# ENV FIREBASE_API_KEY=<your-api-key>
# ENV FIREBASE_AUTH_DOMAIN=<your-auth-domain>

# Build the Next.js app
RUN npm run build

# Expose the port that the app will run on
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]