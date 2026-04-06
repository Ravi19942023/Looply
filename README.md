# `Looply`

Looply is the current productized workspace in this repository. It now includes:

- a protected Looply-style workspace shell
- assistant chat with artifacts and tool calling
- dashboard, customers, campaigns, knowledge base, telemetry, and system-log pages
- local JWT cookie auth
- seeded business/demo data
- knowledge-base uploads and session file uploads
- pgvector-backed RAG retrieval and RAG telemetry

This README documents the current Looply app in this repository, not the original template the codebase started from.

---

## Stack

- Next.js 16 App Router
- React 19
- Vercel AI SDK
- Postgres + Drizzle ORM
- `pgvector`
- Vercel Blob
- local JWT cookie auth
- Tailwind + shadcn/ui

---

## App Routes

Protected workspace routes:

- `/dashboard`
- `/assistant`
- `/assistant/[id]`
- `/customers`
- `/campaigns`
- `/knowledge-base`
- `/telemetry`
- `/system-logs`

Compatibility routes:

- `/` redirects into the protected workspace shell
- `/chat/[id]` remains as a compatibility alias and redirects to `/assistant/[id]`

Auth routes:

- `/login`
- `/register`

---

## Architecture

```text
app/
  (auth)/              login/register UI and auth actions
  (chat)/              protected workspace routes, chat APIs, app pages
components/
  chat/                assistant UI, message rendering, artifacts, tool cards
  workspace/           protected shell, sidebar, page shells, page widgets
  ui/                  shared primitives
hooks/
  use-active-chat      assistant chat state and transport wiring
lib/
  ai/                  models, prompts, tools, provider wiring
  auth/                JWT cookie auth helpers
  db/                  schema, queries, migrations, seed
  rag/                 parsing, chunking, embeddings, retrieval, telemetry
```

Key runtime flow:

1. User signs in with local JWT auth.
2. Protected workspace shell renders compact Looply-style navigation.
3. Assistant requests hit `app/(chat)/api/chat/route.ts`.
4. The AI SDK model can call business tools, artifact tools, and RAG retrieval.
5. Knowledge retrieval uses:
   - global knowledge-base documents
   - session chat files
   - session documents are prioritized over global docs when both match
6. Assistant UI renders explicit tool cards, artifact previews, and campaign approval/send flows.

---

## Database Model

Current schema includes:

- auth and chat:
  - `User`
  - `Chat`
  - `Message_v2`
  - `Vote_v2`
  - `Stream`
- artifacts:
  - `Document`
  - `Suggestion`
- business data:
  - `Customer`
  - `CustomerMetric`
  - `Product`
  - `Transaction`
  - `Campaign`
  - `CampaignLog`
  - `UserMemory`
- knowledge and retrieval:
  - `KnowledgeDocument`
  - `ChatDocument`
  - `DocumentEmbedding`
  - `RagTelemetryLog`

`KnowledgeDocument` contains curated docs and uploaded global docs.

`ChatDocument` contains chat/session files uploaded inside a specific assistant conversation.

`DocumentEmbedding` stores chunk text plus embeddings in `pgvector`.

`RagTelemetryLog` tracks embedding and retrieval operations.

---

## Knowledge Base and RAG

### Global knowledge-base uploads

Supported:

- PDF
- DOCX
- TXT

Flow:

1. upload file from `/knowledge-base`
2. write blob to Vercel Blob
3. extract text
4. preprocess text
5. chunk text
6. embed chunks
7. store metadata in `KnowledgeDocument`
8. store vectors in `DocumentEmbedding`

### Session chat files

Supported:

- PDF
- DOCX
- TXT
- Markdown
- image uploads still work separately for multimodal chat

Flow:

1. upload file inside assistant composer
2. route to `/api/chat-files`
3. store in Blob
4. extract + preprocess + chunk + embed
5. persist to `ChatDocument`
6. persist vectors to `DocumentEmbedding` under chat namespace

### Retrieval behavior

Knowledge retrieval uses:

- semantic search over embeddings
- lexical fallback over stored content
- merged ranking
- session-first priority when both session and global docs match

The chat prompt is configured so knowledge questions should use retrieval instead of answering from generic model knowledge.

If retrieval returns no relevant context, the assistant should say it does not have enough information in the knowledge base.

---

## Telemetry

The telemetry page includes:

- chat/message/document/campaign activity summaries
- RAG token totals
- query embedding count
- document embedding count
- retrieval count
- detailed RAG operation rows with:
  - source
  - model
  - actor
  - chat linkage
  - token counts
  - timestamp

RAG telemetry rows are written to `RagTelemetryLog`.

---

## Seeded Accounts

After running `pnpm run db:seed`, these accounts are created/reset:

Primary local login:

- email: `admin@looply.ai`
- password: `password123`

---

## Seeded Demo Data

The seed currently creates:

- 80 customers
- 20 products
- 600 transactions
- multiple campaigns and campaign logs
- user memory profiles
- curated knowledge documents

RAG telemetry rows and uploaded document rows are not faked by seed. Those are created by real app usage.

---

## Environment Variables

Start from `.env.example`.

Required or commonly used values:

```bash
AUTH_SECRET=
AI_GATEWAY_API_KEY=
BLOB_READ_WRITE_TOKEN=
POSTGRES_URL=
REDIS_URL=
CHAT_MAX_MESSAGES_PER_HOUR=1000
EMAIL_PROVIDER=ses
EMAIL_FROM=
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
CRON_SECRET=
```

Also supported:

```bash
IS_DEMO=0
RAG_EMBEDDING_MODEL=openai/text-embedding-3-small
CRON_SECRET=
```

Notes:

- `POSTGRES_URL` must point to a Postgres instance with `pgvector` available.
- Blob uploads currently assume a private Blob store and use private access.
- `REDIS_URL` is optional for resumable stream support; the app can still run without it.
- confirmed campaign send requires valid SES env configuration

---

## Step-by-Step Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create your environment file:

```bash
copy .env.example .env
```

3. Fill in at least:

```bash
AUTH_SECRET=...
AI_GATEWAY_API_KEY=...
BLOB_READ_WRITE_TOKEN=...
POSTGRES_URL=...
CHAT_MAX_MESSAGES_PER_HOUR=1000
EMAIL_PROVIDER=ses
EMAIL_FROM=...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
CRON_SECRET=...
```

4. Apply database migrations:

```bash
pnpm db:push
```

5. Seed local data:

```bash
pnpm run db:seed
```

6. Start the dev server:

```bash
pnpm dev
```

7. Open:

```text
http://localhost:3000
```

8. Log in with:

```text
admin@looply.ai
password123
```

---

## Common Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm db:migrate
pnpm db:seed
pnpm db:generate
pnpm db:push
pnpm exec tsc --noEmit
pnpm exec next build
pnpm test
```

---

## Upload Notes

Knowledge base uploads:

- use the Knowledge Base page
- uploaded docs become globally retrievable if `inContext` is enabled

Assistant session files:

- upload from the assistant composer
- these files are scoped to the current chat
- session files should outrank global docs during retrieval

Image uploads:

- still use the existing image upload path
- separate from document ingestion

---

## Current Constraints

- customer/campaign/dashboard pages are first-pass workspace pages, not full Looply CRUD parity yet
- knowledge retrieval is implemented, but quality still depends on the uploaded document corpus and embedding quality
- chat knowledge answers are only as good as the indexed knowledge actually present
- full external integration/settings parity with Looply is still out of scope

---

## Verification

Current repo verification commands used during migration work:

```bash
pnpm exec tsc --noEmit
pnpm exec next build
pnpm run db:seed
```

If you change schema or RAG code, rerun:

```bash
pnpm db:migrate
pnpm run db:seed
pnpm exec next build
```

---

## Background Job

`chatbot-main` includes a cron-compatible metrics recompute route:

```text
POST /api/cron/recompute-metrics
```

Authorization:

- `x-vercel-cron: 1`
- or `Authorization: Bearer <CRON_SECRET>`
- or `x-api-key: <CRON_SECRET>`

What it recomputes:

- `CustomerMetric.totalRevenue`
- `CustomerMetric.ltv`
- `CustomerMetric.orderCount`
- `CustomerMetric.avgOrderValue`
- `CustomerMetric.lastPurchaseAt`
- `CustomerMetric.recencyScore`
- `CustomerMetric.frequencyScore`
- `CustomerMetric.monetaryScore`
- `CustomerMetric.churnRiskScore`

Vercel schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/recompute-metrics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Manual trigger:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/recompute-metrics
```
