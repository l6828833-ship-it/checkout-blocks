FROM node:22-alpine

RUN apk add --no-cache openssl

EXPOSE 3000
WORKDIR /app

# Install every dependency before the React Router build. Prisma remains
# available at runtime because docker-start applies the reviewed migration.
COPY package.json package-lock.json .
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

ENV NODE_ENV=production
CMD ["npm", "run", "docker-start"]
