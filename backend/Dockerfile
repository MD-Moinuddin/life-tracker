FROM node:24-slim AS build

WORKDIR /app

# Copied separately from the rest of the source so Docker can cache this
# layer, and skip re-running npm ci when only application code changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-slim AS runtime

WORKDIR /app

# Fresh install here, not copied from the build stage, so devDependencies
# (TypeScript, ESLint, tsx, etc.) never end up in the final image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# The official Node image already ships a non-root "node" user; switching
# to it means the app never runs as root in the final container.
USER node

EXPOSE 4000
CMD ["node", "dist/server.js"]
