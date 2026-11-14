# syntax=docker/dockerfile:1
# the app is static, so build on the runner's own architecture and only copy the result into each target image
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM nginx:1.27-alpine
# the official image envsubsts /etc/nginx/templates/*.template at start and sources *.envsh first
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/15-qbt.envsh /docker-entrypoint.d/15-qbt.envsh
COPY --from=build /app/dist /usr/share/nginx/html
ENV QBT_URL=""
EXPOSE 80
