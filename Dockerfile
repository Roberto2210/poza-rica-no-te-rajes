FROM node:18-alpine AS build
WORKDIR /app
# Vite incrusta estas variables al compilar; Railway las pasa como build args
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_USE_LOCAL_DATA
COPY . .
RUN npm ci || npm i
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
CMD ["serve","-s","dist","-l","8080"]
