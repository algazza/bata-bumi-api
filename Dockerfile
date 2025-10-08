FROM oven/bun:1 AS builder

WORKDIR /app

COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build


FROM oven/bun:1 AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY package.json bun.lockb ./

EXPOSE 3000

CMD ["bun", "dev"]
