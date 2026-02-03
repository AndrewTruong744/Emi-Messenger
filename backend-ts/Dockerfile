FROM node:22.16-alpine AS builder

# Prisma 7 binaries on Alpine require these for the Query Engine
RUN apk add --no-cache openssl libc6-compat

# creates a new /app folder and works in there
WORKDIR /app

# copies package.json and package-lock.json
COPY package*.json ./

# need the config and schema for the 'generate' command
COPY src/prisma.config.ts ./src/
COPY prisma ./prisma/

COPY global-bundle.pem ./

RUN npm ci
COPY . .

RUN npx prisma generate

# convert all files in src to javascript
RUN npm run build

FROM node:22.16-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV MODE=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated

COPY global-bundle.pem ./

EXPOSE 3000

# enabling source maps to help in production debugging
CMD ["node", "--enable-source-maps", "dist/app.js"]