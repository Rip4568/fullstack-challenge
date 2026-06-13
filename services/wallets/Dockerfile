FROM oven/bun:1

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bunx prisma generate

EXPOSE 4002

CMD ["sh", "-c", "bunx prisma db push && bun run src/main.ts"]
