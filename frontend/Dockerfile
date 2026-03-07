FROM node:20 AS build

WORKDIR /app

# copy vite project
COPY vite-project/package*.json ./

RUN npm install

COPY vite-project .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80