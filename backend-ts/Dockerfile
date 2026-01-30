FROM node:22.16-alpine AS builder

# creates a new /app folder and works in there
WORKDIR /app

# copies package.json and package-lock.json
COPY package*.json ./

RUN npm ci
COPY . .

# convert all files in src to javascript
RUN npm run build

FROM node:22.16-alpine AS runner

WORKDIR /app

ENV MODE=production

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# enabling source maps to help in production debugging
CMD ["node", "--enable-source-maps", "dist/app.js"]