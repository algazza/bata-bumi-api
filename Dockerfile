FROM oven/bun:1 AS builder
WORKDIR /app

COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile

COPY . .

FROM oven/bun:1 AS runner
WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000

# Gunakan perintah produksi, bukan dev mode
CMD ["bun", "run", "start"]
