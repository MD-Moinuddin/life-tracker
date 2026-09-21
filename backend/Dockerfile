FROM node:24-slim AS build

WORKDIR /app

# node:24-slim lacks OpenSSL, which Prisma's query engine needs to detect correctly.
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

USER node

EXPOSE 4000
CMD ["node", "dist/server.js"]
