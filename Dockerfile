FROM node:24-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG APP_VERSION
ENV VITE_APP_VERSION=$APP_VERSION
RUN npm run build

FROM node:24-slim AS final

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENTRYPOINT ["node", "/app/.output/server/index.mjs"]
