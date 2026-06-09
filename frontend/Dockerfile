# === STAGE 1: Build the Angular App ===
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/*/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
