# Stage 1: Build the Mastra agent bundle
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY mastra/ ./mastra/
COPY tsconfig.json ./
RUN npx mastra build --dir ./mastra

# Stage 2: Production — just Node + the self-contained bundle
FROM node:22-slim
WORKDIR /app
COPY --from=builder /app/.mastra/output/ ./
EXPOSE 8080
ENV PORT=8080
CMD ["node", "index.mjs"]
