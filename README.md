# Wealth Tracker

Backend service for financial wealth management that receives, reconciles, and exposes financial events from multiple external sources (banks, crypto brokers, insurers).

## 🚀 Installation

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)

### Install Dependencies

```bash
pnpm install
```

### Database Setup

```bash
# Generate Prisma Client
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

The SQLite database will be created in `prisma/dev.db`.

## 🏃 Running

### 1. Start the Backend Server

```bash
# Development mode (with watch)
pnpm start:dev

# Or production mode
pnpm start:prod
```

The server starts on `http://localhost:3000`.

### 2. Start the Worker (in a separate terminal)

The worker processes events asynchronously:

```bash
pnpm worker
```

**Important**: The worker must be running in parallel with the server to process webhooks.

### 3. (Optional) Start the Frontend

```bash
# Build and serve
pnpm frontend

# Or watch mode
pnpm dev:frontend
```

The frontend will be accessible at `http://localhost:8080`.

## 🧪 Testing

### Send Test Events

```bash
pnpm test:webhooks
```

This script sends various events (Bank, Crypto, Insurer) and displays results after processing.

### Visualize Data in Database

Open Prisma Studio to browse and inspect the database:

```bash
pnpm db:studio
```

Prisma Studio will be accessible at `http://localhost:5555/` where you can:
- View raw events (`RawEvent` table)
- Check normalized events (`NormalizedEvent` table)
- Inspect jobs (`Job` table)
- See projections (`UserSummaryView`, `AccountView`, `TimelineView` tables)

### Webhook Examples

See examples in `examples/`:
- `bank-event.json` - Bank event
- `crypto-event.json` - Crypto event
- `insurer-event.json` - Insurance event

### Test the API

```bash
# Wealth summary
curl http://localhost:3000/users/user-001/wealth/summary

# Account details
curl http://localhost:3000/users/user-001/wealth/accounts

# Timeline
curl http://localhost:3000/users/user-001/wealth/timeline?limit=20
```

## 📁 Project Structure

```
src/
├── main.ts                    # Entry point
├── app.module.ts             # Root module
│
├── common/                    # Shared code
│   ├── constants/            # Enums and constants
│   ├── errors/               # Error classes
│   ├── filters/              # Exception filters
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities
│
├── config/                    # Configuration
│
├── db/prisma/                # Database
│   ├── schema.prisma         # Prisma schema
│   └── prisma.service.ts     # Prisma service
│
└── modules/                   # Business modules
    ├── webhooks/             # Webhook ingestion
    ├── reconciliation/       # Event reconciliation
    ├── wealth/               # Query API
    └── worker/               # Async processing
```

## 🏗️ Architecture

### Technical Choices

- **NestJS**: Modular backend framework with dependency injection
- **Prisma + SQLite**: Type-safe ORM with simple database (no external infra)
- **Event Sourcing (ish)**: Storage of raw and normalized events with projections
- **DB-backed Job Queue**: Database-based queue (no external message broker)
- **Zod**: Schema validation and normalization
- **TypeScript**: Strict typing for safety

### Trade-offs

1. **No Message Broker**: Using a DB queue to avoid external infrastructure (Kafka, RabbitMQ, Redis). Trade-off: less performant but simpler to deploy.

2. **SQLite instead of Postgres**: Embedded database to simplify setup. Trade-off: no multi-process concurrency, but sufficient for a prototype.

3. **Synchronous Reconciliation in Worker**: Projections are recalculated on each event. Trade-off: slower but guarantees consistency.

4. **No Sharding**: All users in the same DB. Trade-off: limits horizontal scalability.

### Solution Limitations

1. **Scalability**: SQLite doesn't handle high concurrency well. For production, migrate to Postgres/MySQL.

2. **Performance**: Projections are recalculated on each event. For large volumes, implement caching or incremental recalculation.

3. **Concurrency**: The job locking system is basic. Under high load, conflicts may occur.

4. **Crypto Valuation**: The pricing system is simplified (mock/deterministic). In production, integrate a real pricing API (CoinGecko, CoinMarketCap).

5. **Multi-currency**: No automatic conversion between currencies. Balances are displayed per currency without aggregation.

### Future Improvements

1. **Infrastructure**:
   - Migrate to Postgres for production
   - Add Redis for caching and sessions
   - Implement a real message broker (Kafka/RabbitMQ) for scalability

2. **Performance**:
   - Cache projections with smart invalidation
   - Incremental projection recalculation instead of full recompute
   - Additional indexes to optimize queries

3. **Features**:
   - Automatic multi-currency conversion with exchange rates
   - Real-time crypto pricing API integration
   - Valuation history
   - Alerts and notifications
   - Data export (CSV, PDF)

4. **Monitoring**:
   - Prometheus metrics
   - Structured logging (ELK stack)
   - Monitoring dashboard
   - Alerts on failed jobs

5. **Security**:
   - Authentication and authorization
   - Webhook signature validation
   - Rate limiting
   - Complete audit trail

## 📡 API Endpoints

### Webhooks

- `POST /webhooks` - Unified endpoint (automatic provider detection)
- `POST /webhooks/bank` - Bank webhook (legacy)
- `POST /webhooks/crypto` - Crypto webhook (legacy)
- `POST /webhooks/insurer` - Insurance webhook (legacy)

### Wealth API

- `GET /users/:userId/wealth/summary` - Global wealth summary
- `GET /users/:userId/wealth/accounts` - Account details
- `GET /users/:userId/wealth/timeline?limit=50&cursor=...` - Timeline with pagination

### Health

- `GET /health` - Health check

## 🔧 Available Scripts

```bash
# Development
pnpm start:dev          # Server in watch mode
pnpm worker             # Standalone worker

# Tests
pnpm test               # Unit tests
pnpm test:webhooks      # Webhook test script

# Database
pnpm db:generate        # Generate Prisma Client
pnpm db:migrate         # Apply migrations
pnpm db:studio          # Open Prisma Studio

# Frontend
pnpm frontend           # Build and serve frontend
pnpm frontend:build     # Build TypeScript frontend
```

## 📝 Event Formats

Each event must contain a common `userId` field. See `examples/` for detailed formats.

### Bank Example

```json
{
  "userId": "user-001",
  "bankId": "BNP",
  "txnId": "txn-12345",
  "date": "2025-12-08T12:00:00Z",
  "type": "credit",
  "amount": 2000,
  "currency": "EUR",
  "account": "acc-01",
  "description": "Salary transfer"
}
```

### Crypto Example

```json
{
  "userId": "user-001",
  "platform": "Coinbase",
  "id": "tx-abc123",
  "time": 1710001000000,
  "type": "crypto_deposit",
  "asset": "BTC",
  "amount": 0.05,
  "fiatValue": 1500,
  "currency": "EUR",
  "walletId": "acc-03"
}
```

### Insurer Example

```json
{
  "userId": "user-001",
  "insurer": "AXA",
  "transactionId": "av-2025-001",
  "timestamp": 1710002000000,
  "movementType": "premium",
  "amount": 500,
  "currency": "EUR",
  "policyNumber": "acc-04"
}
```

## 🧩 Reconciliation

The system automatically handles:

- **Deduplication**: Identical events are ignored
- **Corrections**: New events with the same canonical key but different data replace old ones
- **Late Arrivals**: Late events are correctly integrated into the timeline
- **Incomplete Events**: Default values applied (EUR currency, PENDING status for crypto without valuation)

The canonical key is: `${provider}:${userId}:${providerEventId}:${accountId}`

## 📄 License

UNLICENSED
