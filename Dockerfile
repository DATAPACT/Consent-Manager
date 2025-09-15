# Stage 1: Build the frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
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
EXPOSE 5173
#CMD ["npm", "run", "client"]
#CMD ["/app/node_modules/.bin/vite"]
#CMD ["tail", "-f", "/dev/null"]
CMD ["npm", "run", "serve-static"]
