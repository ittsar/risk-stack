FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

ENV CHOKIDAR_USEPOLLING=true \
    HOST=0.0.0.0 \
    PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
