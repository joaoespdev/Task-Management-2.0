FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copiar .env para dentro do container
COPY .env .env

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main.js"]
