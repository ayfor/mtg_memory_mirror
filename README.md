# Memory Mirror

A transcript processing service for Magic: The Gathering card extraction. This service accepts game transcripts via API, queues them for NLP processing, and extracts card names with their occurrence counts.

## Tech Stack

- **Fastify** - Fast and low overhead web framework
- **BullMQ** - Redis-based queue for background job processing
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database for data storage
- **TypeScript** - Type-safe JavaScript

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ayfor/mtg_memory_mirror.git
   cd mtg_memory_mirror
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database and Redis connection details:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/memory_mirror?schema=public"
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PORT=3000
   HOST=0.0.0.0
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

6. Build the project:
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode

Start the server:
```bash
npm run dev
```

Start the worker (in a separate terminal):
```bash
npm run worker
```

### Production Mode

Start the server:
```bash
npm start
```

Start the worker:
```bash
npm run worker:prod
```

## API Endpoints

### POST /transcripts

Queue a transcript for card extraction processing.

**Request:**
```bash
curl -X POST http://localhost:3000/transcripts \
  -H "Content-Type: application/json" \
  -d '{"content": "I played a Lightning Bolt and then cast Counterspell on his Force of Will"}'
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Transcript queued for processing"
}
```

### GET /transcripts/:id

Get a transcript with its extracted card counts.

**Request:**
```bash
curl http://localhost:3000/transcripts/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "content": "transcript text",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "cards": [
    { "cardName": "Lightning Bolt", "count": 1 },
    { "cardName": "Counterspell", "count": 1 }
  ]
}
```

### GET /transcripts

List all transcripts.

### GET /health

Health check endpoint.

## Project Structure

```
├── src/
│   └── server.ts           # Fastify server setup
├── routes/
│   └── transcripts.ts      # Transcript API routes
├── jobs/
│   ├── queue.ts            # BullMQ queue configuration
│   └── workers/
│       └── transcriptWorker.ts  # Background job worker
├── services/
│   └── cardExtractor.ts    # Card name extraction service
├── db/
│   └── schema.prisma       # Prisma database schema
├── package.json
├── tsconfig.json
└── .env.example
```

## License

MIT