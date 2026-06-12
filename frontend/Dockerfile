# ============================================================================
# STAGE 1: Build
# ============================================================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copia package.json e bun.lock (se existir) pra instalar dependências
COPY package.json bun.lock* ./
COPY frontend/package.json frontend/

#workspace do service games e wallets
COPY services/games/package.json services/games/
COPY services/wallets/package.json services/wallets/
COPY packages packages/

# Instala dependências (todas as do monorepo)
RUN bun install

# Copia código-fonte da aplicação
COPY frontend ./frontend

# Reinstala dependências após copiar o código-fonte completo
# (garante que o Bun resolva corretamente os bins e imports do workspace)
RUN bun install

# Build da aplicação (compila pra produção)
WORKDIR /app/frontend

# garante usar o runtime do bun pra buildar, evitando problemas de compatibilidade com o node
RUN bun --bun run build

# ============================================================================
# STAGE 2: Runtime
# ============================================================================
FROM oven/bun:1

WORKDIR /app/frontend

# Nitro gera tudo que é necessário em .output/ — é self-contained
COPY --from=builder /app/frontend/.output ./.output

# Porta que a aplicação vai escutar (Nitro usa NITRO_PORT)
EXPOSE 3000

ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
