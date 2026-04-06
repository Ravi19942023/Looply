# Context: Looply AI Business Assistant — Audit Session

## 📋 Project Status
- **Current Task**: Architectural Refactor & Gap Closure.
- **Completed**:
  - **DB Consolidation**: Centralized to single `lib/db/client.ts` pool.
  - **Monolith Split**: `queries.ts` (2340 lines) split into 7 feature modules in `lib/db/queries/`.
  - **Auth Simplification**: Removed `AuthUser.type` redundancy; corrected session roles.
  - **RAG Refactor**: Fixed pool duplication in `rag/service.ts`; improved context retrieval.
  - **Rate Limit Upgrade**: Implemented user+IP scoped limiting in `ratelimit.ts`.
  - **Cron Compatibility**: Switched cron route to GET for Vercel support.
  - **Integrity Fixes**: SQL Migration for unique email constraints and auto-updated triggers.
  - **LTV Improvement**: Weighted annual projection LTV formula in `metrics-compute.ts`.

## 🏗️ Architecture Summary
Looply follows a **modular Next.js architecture**. Database logic is isolated in `@/lib/db/queries` utilizing **Drizzle ORM**. AI orchestration is handled via **Vercel AI SDK**, with **RAG** services using **pgvector**. Auth is a custom JWT implementation with **Drizzle** session backing.

## 🔗 Key References
- Repository: `c:\Users\Rays\Documents\Project\Looplly\chatbot-main`
- Shared DB Client: `lib/db/client.ts`
- Feature Queries: `lib/db/queries/*.queries.ts`
- Schema Migrations: `lib/db/migrations/`
- RAG Logic: `lib/rag/service.ts`
- Analytics: `lib/analytics/metrics-compute.ts`

## 📅 Session History
- **Checkpoint 1 (Audit)**: Full system walk-through and gap analysis. Found critical bugs in RAG, Auth, and DB.
- **Checkpoint 2 (Refactoring)**: Monolith split complete. Fixed duplicate DB pools. Corrected Auth redundancy. Added unique constraints and trigger-based `updatedAt`. Fixed Cron GET route, LTV calc, and Rate Limiter.
- **Checkpoint 3 (Memory)**: Implemented tiered memory management. Added `CHAT_HISTORY_LIMIT` environment variable support to tune short-term memory depth. Clarified AI tools for long-term user context.

