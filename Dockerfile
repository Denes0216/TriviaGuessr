# Stage 1: build the React client
FROM node:20-alpine AS client-build
WORKDIR /build
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2: production server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
# server/index.js resolves ../client/dist relative to __dirname (/app)
COPY --from=client-build /build/dist /client/dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
