Esse arquivo serve para ditar e anotar todas as tomadas de decisão que eu fiz durante o processo de desnvolvimento.
Durante a fase de setup passei por um problema como:

----

PS C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\frontend> bun run dev                     
$ vite dev --port 3000
failed to load config from C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\frontend\vite.config.ts
error when starting dev server:
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'nitro' imported from C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\node_modules\.bun\nitro-nightly@3.0.1-20260611-123640-7765bcb7+d0489808e633805b\node_modules\nitro-nightly\dist\_build\common.mjs
    at Object.getPackageJSONURL (node:internal/modules/package_json_reader:301:9)
    at packageResolve (node:internal/modules/esm/resolve:768:81)
    at moduleResolve (node:internal/modules/esm/resolve:859:18)
    at defaultResolve (node:internal/modules/esm/resolve:992:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:691:20)
    at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:708:38)
    at ModuleLoader.resolveSync (node:internal/modules/esm/loader:740:52)
    at #resolve (node:internal/modules/esm/loader:673:17)
    at ModuleLoader.getOrCreateModuleJob (node:internal/modules/esm/loader:593:35)
    at ModuleJob.syncLink (node:internal/modules/esm/module_job:163:33) {
  code: 'ERR_MODULE_NOT_FOUND'
}
error: script "dev" exited with code 1
PS C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\frontend> bun install
bun install v1.3.14 (0d9b296a)

Checked 378 installs across 460 packages (no changes) [128.00ms]

----

Aparenemente eses problema era por causa da versão do nitro em especifico configurado no packge.json no frontend:
nitro": "npm:nitro-nightly@latest"
Puxando uma versão problematica (3.0.1-20260611) que não foi depurada corretamente. por tanto deeixei setado na versão:
"nitro": "^3.0.0"

NOTA IMPORTANTE: com isso fica lição, JAMAIS setar em @latest as versões do Nitro.

----

Durante a fase de build no Docker passei por outro problema como:

frontend-1  | [request error] [unhandled] [GET] http://localhost:3000/
frontend-1  | Cannot find any route matching [GET] http://localhost:3000/

----

O servidor Nitro subia normalmente dentro do container, recebia as requisições, mas não encontrava nenhum handler registrado — resultando em 500/404 em todas as rotas.

Tentei usar o preset "bun" do Nitro (nitro({ preset: 'bun' })) conforme a documentação oficial do Bun, mas esse preset tem um bug ativo de routing em produção (issue #3475 do TanStack/router). Tentei também o preset padrão "node-server" com node e com bun — mesmo resultado.

Após investigação, concluí que o SSR do TanStack Start em Docker é um bug ativo sem solução definitiva nas versões atuais (junho/2026).

Decisão tomada: como o projeto é um jogo em tempo real com WebSocket e autenticação obrigatória, SSR não agrega valor real (sem SEO, sem crawlers). Optei por rodar em modo SPA com um server.js customizado que serve os arquivos estáticos de dist/client via Bun.serve().

NOTA IMPORTANTE: o TanStack Start em modo SSR com Docker ainda não é confiável para produção. Para projetos que realmente precisam de SSR, aguardar correção oficial ou usar Next.js.

----

## Decisões Arquiteturais do Backend (Seguindo o README.md e Além)

Decidi seguir estritamente o que foi exigido no `README.md` técnico para garantir que todos os critérios de avaliação fossem plenamente atingidos, além de resolver bugs de concorrência e ambiente:

1. **Microsserviços e Mensageria (Sagas via RabbitMQ):**
   * Separamos o `Game Service` (porta 4001) e o `Wallet Service` (porta 4002) comunicando de forma assíncrona por RabbitMQ.
   * Fluxo de apostas em duas fases (`PENDING` -> debitado na carteira -> confirmado no jogo). No caso de falha no débito, o saldo é estornado/reembolsado via Saga compensatória (`wallet.refund`).
2. **Idempotência e Segurança Financeira:**
   * Para evitar double-spend e condições de corrida (race conditions) em requisições concorrentes, usamos lock pessimista no banco (`SELECT FOR UPDATE` nas consultas de saldo).
   * A idempotência contra processamento duplicado de mensagens do RabbitMQ foi resolvida de forma simples e robusta direto no banco: criamos uma constraint única `UNIQUE(reference_id, type)` no ledger de transações. Se o RabbitMQ reenviar a mensagem, o banco aborta a operação naturalmente.
3. **Provably Fair de Verdade:**
   * Implementação matemática pura no `ProvablyFairService` usando HMAC-SHA256, com 3% de vantagem da casa (house edge) e distribuição de Pareto para calcular o crash point, limitado a um teto seguro de 1.000.000x para proteger a banca.
4. **Isolamento do Prisma no Monorepo:**
   * Durante o desenvolvimento local, percebi que rodar `prisma generate` em ambos os serviços causava conflitos porque os dois tentavam gravar na pasta `@prisma/client` do `node_modules` global do monorepo, sobrescrevendo um ao outro.
   * Decisão tomada: isolei os caminhos dos generators em cada `schema.prisma` direcionando a saída para `./src/infrastructure/persistence/prisma/client`. Dessa forma, cada serviço tem o seu cliente privado gerado e isolado, importando localmente sem qualquer conflito no monorepo.
5. **Autorecuperação de Rodadas Presas (Self-Healing):**
   * Se o container do Game Service reiniciar de forma inesperada durante uma rodada ativa (`BETTING` ou `GAMEPLAY`), essa rodada ficaria presa nesse status para sempre.
   * Para resolver isso, implementamos uma rotina de limpeza (`cleanUpStuckRounds`) que executa logo no boot do servidor, localiza rodadas prestas de sessões anteriores e as finaliza como `CRASHED` (com apostas liquidadas como `LOST`). Além disso, ajustamos a busca da rodada ativa para ordenar sempre pela mais recente (`createdAt: "desc"`).
6. **Healthchecks Resilientes no Docker Compose:**
   * Como a imagem base do Bun (`oven/bun:1`) é minimalista e não possui `wget` ou `curl` pré-instalados, o healthcheck padrão do docker-compose falhava, marcando as aplicações como `unhealthy`.
   * Decisão tomada: substituímos os testes por scripts de um único comando rodando no engine de JS nativo do Bun via `bun -e \"fetch('http://localhost:.../health').then(...)\"`, resolvendo o problema de forma nativa e sem inflar a imagem do contêiner.

## Possibilidade de Configuração de um Painel Admin (Ideias para o Futuro)

Para tornar o ecossistema do Crash Game ainda mais profissional e robusto, seria excelente configurar uma interface administrativa (Admin Panel) para o gerenciador da plataforma poder ajustar configurações em tempo real:

* **Controle de Parâmetros de Rodada:**
  * Possibilidade de ajustar dinamicamente o tempo da fase de apostas (atualmente estático em 10s) e de cooldown/espera após crash (atualmente estático em 5s).
* **Gestão Matemática da Banca:**
  * Configurar a porcentagem de House Edge (vantagem da casa, hoje em 3%).
  * Alterar o teto do multiplicador máximo (atualmente 1.000.000x).
  * Rotacionar ou atualizar a semente pública/cliente (Client Seed) e gerar novas sementes secretas para o servidor.
* **Dashboard Financeiro e Logs:**
  * Gráficos em tempo real com as métricas de GGR (Gross Gaming Revenue), volume de apostas por moeda (BRL, USD, BTC, ETH) e taxas de crash point das rodadas.
  * Tela de conciliação de ledger da carteira para auditar depósitos, saques e payouts.
