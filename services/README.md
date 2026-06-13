# Documentação técnica dos Microsserviços: Games e Wallets

Esta documentação detalha a arquitetura, as APIs REST, os DTOs de entrada/saída, o fluxo de autenticação e a comunicação WebSocket/RabbitMQ dos microsserviços de jogos (**Games Service**) e carteiras (**Wallets Service**).

---

## 1. Visão Geral da Arquitetura

O ecossistema é baseado em microsserviços distribuídos que se comunicam de forma síncrona via HTTP/REST e assíncrona por meio do **RabbitMQ**.

### Componentes de Infraestrutura
- **Kong API Gateway (Porta `8000`):** Ponto de entrada unificado para o cliente. Realiza o roteamento para os serviços correspondentes, limpando o prefixo da rota (`strip_path: true`).
  - Rotas expostas no gateway:
    - `/games/*` mapeia para `http://games:4001/*`
    - `/wallets/*` mapeia para `http://wallets:4002/*`
- **Games Service (Porta `4001`):** Responsável por gerenciar as rodadas do jogo estilo "Crash", calcular o multiplicador em tempo real, aplicar a mecânica de Provably Fair e gerenciar as apostas.
- **Wallets Service (Porta `4002`):** Gerencia os saldos e transações financeiras dos jogadores em múltiplas moedas (BRL, USD, BTC, ETH).
- **Keycloak (Porta `8080`):** Identity Provider (IdP) responsável por autenticar os usuários e gerar tokens JWT que atestam a identidade do jogador.

### Autenticação e Segurança
Os endpoints restritos requerem um token JWT Bearer emitido pelo Keycloak, fornecido no header HTTP `Authorization`.
- **Header esperado:** `Authorization: Bearer <JWT_TOKEN>`
- **Algoritmo de assinatura:** RS256
- **Validação de Assinatura:** O `AuthGuard` de ambos os serviços obtém as chaves criptográficas públicas do IdP através do endpoint de JWKS (`/protocol/openid-connect/certs`).
- **Campos decodificados anexados ao request (`req.user`):**
  - `id`: O identificador único do usuário (campo `sub` do token).
  - `username`: O nome exibível do jogador (campo `preferred_username` do token).

---

## 2. Endpoints REST

Abaixo estão listados todos os endpoints REST de ambos os microsserviços expostos pelo API Gateway.

### Resumo dos Endpoints

| Serviço | Método | Rota no Gateway | Rota Direta (Interna) | Autenticação | Descrição |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Games** | `GET` | `/games/health` | `/health` | Não | Retorna o status de integridade do serviço de jogos. |
| **Games** | `GET` | `/games/rounds/current` | `/rounds/current` | Não | Retorna a rodada ativa atual (fase de aposta ou multiplicador em crescimento) ou a última rodada finalizada. |
| **Games** | `GET` | `/games/rounds/history` | `/rounds/history` | Não | Retorna o histórico de rodadas finalizadas de forma paginada. |
| **Games** | `GET` | `/games/rounds/:roundId/verify` | `/rounds/:roundId/verify` | Não | Abre as sementes criptográficas para validação do Provably Fair de uma rodada finalizada. |
| **Games** | `GET` | `/games/bets/me` | `/bets/me` | Sim (Bearer) | Retorna o histórico de apostas paginado do jogador autenticado. |
| **Games** | `POST` | `/games/bet` | `/bet` | Sim (Bearer) | Realiza uma nova aposta na rodada ativa atual (status PENDING). |
| **Games** | `POST` | `/games/bet/cashout` | `/bet/cashout` | Sim (Bearer) | Realiza o saque (cash out) da aposta na rodada em andamento. |
| **Wallets** | `GET` | `/wallets/health` | `/health` | Não | Retorna o status de integridade do serviço de carteiras. |
| **Wallets** | `POST` | `/wallets` | `/` | Sim (Bearer) | Cria a carteira e saldos para o jogador autenticado caso não exista. |
| **Wallets** | `GET` | `/wallets/me` | `/me` | Sim (Bearer) | Retorna a carteira com saldos detalhados e estimativas de câmbio para o jogador autenticado. |

---

### Detalhamento dos DTOs de Entrada e Saída

#### GET /games/health e GET /wallets/health
Retorna um status de sinal de vida do microsserviço correspondente.

- **Payload de Entrada:** Nenhum
- **Payload de Saída (JSON):**
```json
{
  "status": "ok",
  "service": "games" // ou "wallets"
}
```

#### GET /games/rounds/current
Obtém o estado atual do jogo. O crashPoint e a serverSeed original permanecem como null até que a rodada seja finalizada.

- **Payload de Entrada:** Nenhum
- **Payload de Saída (JSON):**
```json
{
  "id": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
  "gameId": "85ef0dbd-ec1b-4f9a-8c5e-cbff3b2efd41",
  "status": "BETTING", // Possíveis: "BETTING", "GAMEPLAY", "CRASHED"
  "serverSeed": null,
  "serverSeedHash": "3ba486259021815db5e1564f9f257d77b8cfd0d5402a4bf7ad08dfdf74df8342",
  "clientSeed": "jungle-gaming-fair-seed-2026",
  "crashPoint": null,
  "createdAt": "2026-06-13T17:59:17.000Z",
  "endedAt": null,
  "bets": []
}
```

#### GET /games/rounds/history
Retorna a listagem paginada de rodadas já crashadas.

- **Parâmetros de Query (Query Params - `PaginationQueryDto`):**
  - `limit` (opcional, default: `20`, min: `1`, max: `100`): Limite de itens na página.
  - `offset` (opcional, default: `0`, min: `0`): Deslocamento para paginação.
- **Payload de Saída (JSON):**
```json
{
  "items": [
    {
      "id": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
      "gameId": "85ef0dbd-ec1b-4f9a-8c5e-cbff3b2efd41",
      "status": "CRASHED",
      "serverSeed": "c71fa14f6b158097b6a1e5a59d873d6b00c8bdbe829ef26a7dbcf0b9f27d5c90",
      "serverSeedHash": "3ba486259021815db5e1564f9f257d77b8cfd0d5402a4bf7ad08dfdf74df8342",
      "clientSeed": "jungle-gaming-fair-seed-2026",
      "crashPoint": 2.45,
      "createdAt": "2026-06-13T17:59:17.000Z",
      "endedAt": "2026-06-13T17:59:32.000Z"
    }
  ],
  "total": 120,
  "limit": 1,
  "offset": 0
}
```

#### GET /games/rounds/:roundId/verify
Endpoint público de transparência que revela as sementes criptográficas de uma rodada finalizada para auditoria matemática no lado do cliente.

- **Parâmetro de Rota (Path Param):**
  - `roundId` (string, obrigatório, UUID): ID da rodada.
- **Payload de Saída (JSON):**
```json
{
  "id": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
  "gameId": "85ef0dbd-ec1b-4f9a-8c5e-cbff3b2efd41",
  "status": "CRASHED",
  "serverSeed": "c71fa14f6b158097b6a1e5a59d873d6b00c8bdbe829ef26a7dbcf0b9f27d5c90",
  "serverSeedHash": "3ba486259021815db5e1564f9f257d77b8cfd0d5402a4bf7ad08dfdf74df8342",
  "clientSeed": "jungle-gaming-fair-seed-2026",
  "crashPoint": 2.45,
  "createdAt": "2026-06-13T17:59:17.000Z",
  "endedAt": "2026-06-13T17:59:32.000Z"
}
```

#### GET /games/bets/me
Retorna o histórico de apostas efetuadas pelo usuário autenticado.

- **Parâmetros de Query (Query Params - `PaginationQueryDto`):**
  - `limit` (opcional, default: `20`, min: `1`, max: `100`): Limite de itens na página.
  - `offset` (opcional, default: `0`, min: `0`): Deslocamento de paginação.
- **Header:** `Authorization: Bearer <TOKEN>`
- **Payload de Saída (JSON):**
```json
{
  "items": [
    {
      "id": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
      "roundId": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
      "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
      "username": "jogador_exemplo",
      "amount": 1000,
      "currency": "BRL",
      "status": "CASHOUT", // Possíveis: "PENDING", "CONFIRMED", "CASHOUT", "LOST", "REJECTED"
      "cashOutMultiplier": 1.5,
      "payoutAmount": 1500,
      "createdAt": "2026-06-13T17:59:18.000Z",
      "round": {
        "status": "CRASHED",
        "crashPoint": 2.45,
        "serverSeedHash": "3ba486259021815db5e1564f9f257d77b8cfd0d5402a4bf7ad08dfdf74df8342"
      }
    }
  ],
  "total": 45,
  "limit": 1,
  "offset": 0
}
```

#### POST /games/bet
Realiza uma aposta preliminar na rodada atual. O status inicial é `PENDING`. Um evento do RabbitMQ é emitido para debitar o saldo do jogador no microsserviço de carteira.

- **Header:** `Authorization: Bearer <TOKEN>`
- **Payload de Entrada (JSON - `PlaceBetDto`):**
```json
{
  "amount": 1000, // Valor na menor fração física. Ex: 1000 centavos = R$ 10.00
  "currency": "BRL" // Opcional. Padrão "BRL". Possíveis: "BRL", "USD", "BTC", "ETH"
}
```
- Restrições de Validação (`PlaceBetDto`):
  - `amount`: Tipo inteiro. Valor mínimo `100` (1.00 BRL/USD), valor máximo `100000` (1000.00 BRL/USD).
- **Payload de Saída (JSON - `BetResponseDto`):**
```json
{
  "id": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
  "roundId": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
  "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
  "username": "jogador_exemplo",
  "amount": 1000,
  "currency": "BRL",
  "status": "PENDING",
  "cashOutMultiplier": null,
  "payoutAmount": null,
  "createdAt": "2026-06-13T17:59:18.000Z"
}
```

#### POST /games/bet/cashout
Efetua o saque voluntário do jogador durante a fase ativa de crescimento do multiplicador (`GAMEPLAY`). É validado contra o ponto de crash calculado da rodada atual. Caso válido, a aposta transiciona para `CASHOUT` e dispara um evento do RabbitMQ para creditar a carteira do jogador.

- **Header:** `Authorization: Bearer <TOKEN>`
- **Payload de Entrada (JSON - `CashoutDto`):**
```json
{
  "multiplier": 1.5 // Multiplicador pretendido. Deve ser no mínimo 1.00.
}
```
- **Payload de Saída (JSON - `BetResponseDto`):**
```json
{
  "id": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
  "roundId": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
  "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
  "username": "jogador_exemplo",
  "amount": 1000,
  "currency": "BRL",
  "status": "CASHOUT",
  "cashOutMultiplier": 1.5,
  "payoutAmount": 1500, // 1000 * 1.50 = 1500 centavos
  "createdAt": "2026-06-13T17:59:18.000Z"
}
```

#### POST /wallets
Inicializa a carteira do jogador autenticado com saldos zerados para todas as moedas suportadas (BRL, USD, BTC, ETH) se a carteira ainda não existir. Caso a carteira já exista, o endpoint retorna os dados existentes.

- **Header:** `Authorization: Bearer <TOKEN>`
- **Payload de Entrada:** Nenhum
- **Payload de Saída (JSON - `WalletResponseDto`):**
```json
{
  "id": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
  "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
  "balances": [
    {
      "id": "bc78fa89-cc7e-4688-bf12-58e19c0b1175",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "BRL",
      "amount": 0,
      "amountFormatted": 0,
      "estimatedUsdValue": 0
    },
    {
      "id": "d0c89ba7-b7e8-4a92-bf34-6c57f59d57a1",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "USD",
      "amount": 0,
      "amountFormatted": 0,
      "estimatedUsdValue": 0
    },
    {
      "id": "fd90812b-34a8-4fb8-bcbc-751be67b4da3",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "BTC",
      "amount": 0,
      "amountFormatted": 0,
      "estimatedUsdValue": 0
    },
    {
      "id": "ac8927bb-ef45-4299-bfb7-251f28b7ca89",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "ETH",
      "amount": 0,
      "amountFormatted": 0,
      "estimatedUsdValue": 0
    }
  ],
  "createdAt": "2026-06-13T17:59:17.000Z",
  "updatedAt": "2026-06-13T17:59:17.000Z"
}
```

#### GET /wallets/me
Retorna o estado consolidado da carteira do jogador autenticado. Caso seja o primeiro acesso e a carteira não exista, ela é criada de forma automática sob demanda (Lazy Initialization).

- **Header:** `Authorization: Bearer <TOKEN>`
- **Payload de Entrada:** Nenhum
- **Payload de Saída (JSON - `WalletResponseDto`):**
```json
{
  "id": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
  "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
  "balances": [
    {
      "id": "bc78fa89-cc7e-4688-bf12-58e19c0b1175",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "BRL",
      "amount": 100000, // 1000.00 BRL
      "amountFormatted": 1000,
      "estimatedUsdValue": 18 // Baseado em câmbio simulado (1 BRL = 0.18 USD)
    },
    {
      "id": "d0c89ba7-b7e8-4a92-bf34-6c57f59d57a1",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "USD",
      "amount": 50000, // 500.00 USD
      "amountFormatted": 500,
      "estimatedUsdValue": 500
    },
    {
      "id": "fd90812b-34a8-4fb8-bcbc-751be67b4da3",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "BTC",
      "amount": 100000000, // 1.00000000 BTC (10^8 Satoshis)
      "amountFormatted": 1,
      "estimatedUsdValue": 65000 // Baseado em câmbio simulado (1 BTC = 65,000 USD)
    },
    {
      "id": "ac8927bb-ef45-4299-bfb7-251f28b7ca89",
      "walletId": "78ff0dbf-ec3b-4c9a-9e5c-cbff3b2efd45",
      "currency": "ETH",
      "amount": 1000000000000000000, // 1.000000000000000000 ETH (10^18 Wei)
      "amountFormatted": 1,
      "estimatedUsdValue": 3500 // Baseado em câmbio simulado (1 ETH = 3,500 USD)
    }
  ],
  "createdAt": "2026-06-13T17:59:17.000Z",
  "updatedAt": "2026-06-13T17:59:22.000Z"
}
```

---

## 3. Gateway de WebSocket (Games Service)

O Games Service hospeda um servidor **Socket.io** para emitir o progresso em tempo real da rodada de jogo (Crash) e das atividades de aposta dos jogadores para todos os clientes conectados de forma concorrente.

### Conexão do Servidor WebSocket
- **URL Padrão (Conexão Direta):** `ws://localhost:4001`
- **Namespace padrão:** `/`
- **Autenticação:** Aberto no nível do WebSocket (as restrições e segurança são validadas nos endpoints HTTP REST de ação como aposta e cashout).

### Eventos Emitidos (Server-to-Client)

Abaixo estão descritos todos os eventos de push em tempo real emitidos pelo servidor.

| Nome do Evento | Gatilho / Momento da Emissão | Frequência | Descrição |
| :--- | :--- | :--- | :--- |
| `round:betting` | Início de uma nova rodada (Fase de apostas aberta). | 1 vez por rodada. | Informa que os jogadores têm 10 segundos para realizar suas apostas na rodada corrente. Fornece a semente criptográfica pré-hash do servidor. |
| `round:start` | Fim da fase de apostas. Transição para a fase ativa de crescimento do multiplicador (`GAMEPLAY`). | 1 vez por rodada. | Sinaliza o início da decolagem do multiplicador. |
| `round:tick` | Durante a fase ativa de jogo (`GAMEPLAY`). | A cada 50 milissegundos (20 ticks por segundo). | Transmite o multiplicador corrente calculado e o tempo total decorrido. |
| `round:crashed` | O multiplicador atinge o ponto de crash calculado. | 1 vez por rodada (conclusão). | Declara o final da rodada de jogo, revelando o ponto exato de crash e a semente original do servidor (`serverSeed`) para auditoria de Provably Fair. |
| `bet:placed` | Confirmação de que o débito de aposta de um jogador foi concluído com sucesso. | 1 vez por aposta bem-sucedida. | Informa a todos os clientes conectados sobre a entrada de um novo jogador na rodada. |
| `bet:cashout` | O saque de um jogador na rodada foi processado e creditado com sucesso. | 1 vez por cashout efetuado. | Notifica o sucesso do jogador na rodada, indicando o multiplicador do saque e o valor líquido pago. |

### Payload de Cada Evento WebSocket

#### Evento `round:betting`
```json
{
  "roundId": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
  "durationMs": 10000,
  "serverSeedHash": "3ba486259021815db5e1564f9f257d77b8cfd0d5402a4bf7ad08dfdf74df8342"
}
```

#### Evento `round:start`
```json
{
  "roundId": "e8a719c8-d102-4ec4-bc2c-7b003a274db2"
}
```

#### Evento `round:tick`
```json
{
  "roundId": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
  "currentMultiplier": 1.45,
  "elapsedMs": 3100
}
```

#### Evento `round:crashed`
```json
{
  "roundId": "e8a719c8-d102-4ec4-bc2c-7b003a274db2",
  "crashPoint": 2.45,
  "serverSeed": "c71fa14f6b158097b6a1e5a59d873d6b00c8bdbe829ef26a7dbcf0b9f27d5c90"
}
```

#### Evento `bet:placed`
```json
{
  "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
  "username": "jogador_exemplo",
  "amount": 10.00 // Formatado como float para fácil leitura (ex: 1000 centavos = 10.00 BRL)
}
```

#### Evento `bet:cashout`
```json
{
  "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
  "username": "jogador_exemplo",
  "multiplier": 1.5,
  "payout": 15.00 // Valor líquido creditado formatado (ex: 1500 centavos = 15.00 BRL)
}
```

---

## 4. Comunicação Assíncrona via RabbitMQ

Os microsserviços se comunicam via RabbitMQ utilizando filas dedicadas para garantir transações consistentes e tolerância a falhas.

### Filas e Exchanges Utilizadas
- **Fila do Games Service (`games_queue`):** Recebe eventos de confirmação e status financeiro do Wallets Service.
- **Fila do Wallets Service (`wallets_queue`):** Recebe solicitações de transações (débito, crédito, estorno) vindas do Games Service.

### Detalhamento dos Fluxos de Trabalho (Workflows)

#### Fluxo 1: Criação e Efetivação de Aposta
1. O cliente HTTP dispara `POST /games/bet`.
2. O Games Service cria um registro de aposta com status `PENDING` e emite uma mensagem do RabbitMQ no padrão de evento **`wallet.debit`** na fila `wallets_queue`.
   - **Payload do evento `wallet.debit`:**
     ```json
     {
       "betId": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
       "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
       "amount": "1000", // String contendo BigInt
       "currency": "BRL",
       "username": "jogador_exemplo"
     }
     ```
3. O Wallets Service recebe a mensagem, valida o saldo e debita a carteira do usuário.
4. Se o saldo for suficiente e a operação no banco for bem-sucedida:
   - Emite um evento **`game.debit_success`** na fila `games_queue`.
   - **Payload do evento `game.debit_success`:**
     ```json
     {
       "betId": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
       "playerId": "a82df231-1555-4678-bf78-687dbfe2e041"
     }
     ```
   - O Games Service consome o evento, altera o status da aposta para `CONFIRMED` e dispara o evento WebSocket `bet:placed` a todos os conectados.
5. Se o saldo for insuficiente ou houver erro:
   - Emite um evento **`game.debit_failed`** na fila `games_queue`.
   - **Payload do evento `game.debit_failed`:**
     ```json
     {
       "betId": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
       "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
       "reason": "INSUFFICIENT_FUNDS" // Ou "DEBIT_FAILED"
     }
     ```
   - O Games Service consome o erro e atualiza o status da aposta para `REJECTED`.

#### Fluxo 2: Processamento de Cashout (Saque)
1. O cliente HTTP dispara `POST /games/bet/cashout`.
2. O Games Service valida as condições da rodada e atualiza o status local da aposta para `CASHOUT`.
3. Emite um evento **`wallet.credit`** na fila `wallets_queue`.
   - **Payload do evento `wallet.credit`:**
     ```json
     {
       "betId": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
       "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
       "amount": "1500",
       "currency": "BRL",
       "referenceType": "CASHOUT"
     }
     ```
4. O Wallets Service processa o crédito de forma atômica no saldo do usuário e emite um evento **`game.credit_success`** na fila `games_queue`.
   - **Payload do evento `game.credit_success`:**
     ```json
     {
       "betId": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
       "playerId": "a82df231-1555-4678-bf78-687dbfe2e041"
     }
     ```
5. O Games Service consome e registra a confirmação do crédito do payout da aposta.

#### Fluxo 3: Reembolsos / Estornos (Refund)
Caso uma aposta necessite ser estornada por cancelamento de rodada ou discrepâncias sistêmicas:
1. O Games Service emite um evento **`wallet.refund`** na fila `wallets_queue`.
   - **Payload do evento `wallet.refund`:**
     ```json
     {
       "betId": "d8c1c4e7-4952-4752-bfbc-559d18fa7fb2",
       "playerId": "a82df231-1555-4678-bf78-687dbfe2e041",
       "amount": "1000",
       "currency": "BRL",
       "referenceType": "REFUND"
     }
     ```
2. O Wallets Service estorna o valor original para a carteira do usuário.
