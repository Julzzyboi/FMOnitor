# Stage 1: build the static React/Vite bundle
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes these into the compiled JS at build time - must be present
# before "npm run build" runs, not supplied later like a normal env var.
# .dockerignore excludes .env from the build context, so these can't just be
# read from the file the way a local "npm run build" would - each one needed
# here has to be threaded through explicitly as a build arg.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ARG VITE_MAPBOX_STYLE
ENV VITE_MAPBOX_STYLE=$VITE_MAPBOX_STYLE

RUN npm run build

# Stage 2: serve the built files with nginx - no Node in the final image at all
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
