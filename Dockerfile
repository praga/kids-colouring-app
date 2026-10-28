# Stage 1: Build Frontend
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8086

COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY public ./public
COPY scripts ./scripts
COPY tsconfig*.json ./

RUN mkdir -p /app/data/pages && chown -R node:node /app

USER node

EXPOSE 8086

CMD ["tsx", "server/index.ts"]
