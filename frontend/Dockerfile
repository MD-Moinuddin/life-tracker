FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# --host makes Vite bind to 0.0.0.0 instead of just the container's own
# localhost, so the dev server is actually reachable from the host machine
# through docker-compose's port mapping.
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
