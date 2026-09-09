FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# --host binds to 0.0.0.0 so the dev server is reachable from outside the container.
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
