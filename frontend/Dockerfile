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
RUN bun --bun run build

# ============================================================================
# STAGE 2: Runtime
# ============================================================================
FROM oven/bun:1

WORKDIR /app

# Copia os arquivos compilados e estrutura do frontend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/frontend/package.json ./frontend/package.json

# Copia node_modules completo (shared do monorepo)
COPY --from=builder /app/node_modules ./node_modules

# Copia packages (dependências locais do monorepo)
COPY --from=builder /app/packages ./packages

# Porta que a aplicação vai escutar
EXPOSE 3000

# Entra na pasta frontend e inicia servidor estático
WORKDIR /app/frontend
COPY --from=builder /app/frontend/server.js ./server.js
CMD ["bun", "run", "server.js"]
