# Stage 1: Build the frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build argument for API URL
ARG VITE_API_BASE_URL=http://localhost:8019/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
#--omit=dev
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY vite.config.ts ./vite.config.ts
COPY src ./src

# Note: .env and firebase-credentials.json are mounted as volumes in docker-compose.yml

# Expose both API and static server ports
EXPOSE 8019 5173

# Run both servers (API on 8019, static frontend on 5173)
CMD ["sh", "-c", "npm run server & npm run serve-static"]
