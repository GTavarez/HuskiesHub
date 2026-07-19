FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=https://huskieshub-backend-891073803869.us-central1.run.app
ARG VITE_SOCKET_URL=https://huskieshub-backend-891073803869.us-central1.run.app
ARG VITE_MEDIA_BASE_URL=https://huskieshub-backend-891073803869.us-central1.run.app
ARG VITE_OPENWEATHER_API_KEY
ARG VITE_GOOGLE_MAPS_API_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL
ENV VITE_OPENWEATHER_API_KEY=$VITE_OPENWEATHER_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
