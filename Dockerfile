# Stage 1: Build the frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite build-time args
ARG VITE_API_BASE_URL
ARG VITE_NEGOTIATION_BASE_URL
ARG VITE_USE_EMULATOR
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_NEGOTIATION_BASE_URL=$VITE_NEGOTIATION_BASE_URL \
    VITE_USE_EMULATOR=$VITE_USE_EMULATOR

RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY vite.config.ts ./vite.config.ts
COPY src ./src

EXPOSE 5173
CMD ["npm", "run", "serve-static"]

