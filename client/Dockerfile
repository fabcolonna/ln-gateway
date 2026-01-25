FROM node:20-alpine AS builder

WORKDIR /app/client

RUN corepack enable

COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY client/ ./

ARG CLIENT_API_BASE_URL
ENV CLIENT_API_BASE_URL=$CLIENT_API_BASE_URL

RUN pnpm run build:docker

FROM nginx:1.27-alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 8080
