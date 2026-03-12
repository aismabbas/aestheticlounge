FROM node:20-alpine

WORKDIR /app

# Install deps first (cache layer)
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Copy source + fonts
COPY tsconfig.json ./
COPY src/ ./src/
COPY fonts/ ./fonts/

# Build TypeScript
RUN npm run build

# Prune dev deps
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/index.js"]
