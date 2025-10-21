FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci || npm i
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
CMD ["serve","-s","dist","-l","8080"]
