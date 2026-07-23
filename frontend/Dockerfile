# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
# Optional: pass a different backend URL at build time, e.g.
#   docker build --build-arg VITE_API_URL=/api .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
