FROM node:lts-alpine AS builder

WORKDIR /app

COPY ./ /app

RUN npm run bootstrap

FROM node:lts-alpine AS release

RUN apk update && apk upgrade

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

RUN npm ci --ignore-scripts --omit=dev --no-audit --no-fund

ENTRYPOINT ["node", "dist/index.js"]