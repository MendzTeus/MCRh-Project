FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Install only production deps for the API server
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime

RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy API server + node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/node_modules ./node_modules

# Supervisor config — runs nginx + node API together
RUN mkdir -p /etc/supervisor.d
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
