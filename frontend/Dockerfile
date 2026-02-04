# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy only dependency manifests first (better caching)
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

# Copy the rest of the repo pieces needed for build
WORKDIR /app
COPY frontend ./frontend
COPY scripts ./scripts
COPY data ./data

# Build (runs your prebuild, which calls ../scripts/sync-data.mjs)
WORKDIR /app/frontend
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]