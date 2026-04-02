FROM node:24-alpine

WORKDIR /workspace

COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm install

COPY . .

WORKDIR /workspace/backend

EXPOSE 4000

