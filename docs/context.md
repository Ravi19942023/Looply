# Project Analysis: Looply AI Chatbot

## Overview
Looply AI Chatbot is a sophisticated, real-time AI-powered web application built with **Next.js**, **React**, and the **Vercel AI SDK**. It features a "canvas-like" artifact system (similar to Anthropic Claude's Artifacts) that allows for dynamic generation and editing of code, text, spreadsheets, and more.

## Technology Stack
- **Framework**: Next.js (App Router)
- **AI Core**: Vercel AI SDK (`ai` package)
- **Database**: Drizzle ORM (PostgreSQL)
- **Styling**: Vanilla CSS (Next.js CSS Modules or global CSS)
- **State Management**: React Hooks and Context (e.g., `DataStreamProvider`)
- **Persistence**: Redis (for resumable streams) and PostgreSQL (for chats/messages/documents)

## How It Works

### 1. Chat Interaction Flow
1. **User Input**: A user sends a message via `components/chat/multimodal-input.tsx`.
2. **API Route**: The request is POSTed to `app/(chat)/api/chat/route.ts`.
3. **AI Streaming**: 
   - The route handler uses `streamText` from the AI SDK.
   - It incorporates `systemPrompt` from `lib/ai/prompts.ts`.
   - It provides a set of tools that the model can call.

### 2. The Tool Calling System
Tools are defined in `lib/ai/tools/` and passed to the `streamText` function. Key tools include:
- `getWeather`: Simple data fetching example.
- `createDocument`: The core tool for generating artifacts.
- `editDocument`: Modifies existing artifacts via natural language descriptions.
- `updateDocument`: Higher-level document updates.
- `requestSuggestions`: AI-generated suggestions for further edits.

**Anatomy of a Tool (`createDocument` example):**
- **Description**: Tells the AI when and how to use the tool.
- **Parameters (formerly inputSchema)**: Zod schema defining the tool's input (e.g., `title`, `kind`).
- **Execute**: An async function that runs when the AI calls the tool. It uses `dataStream.write` to communicate status and metadata to the frontend in real-time.

### 3. The Artifacts System
Artifacts are specialized components rendered in a side panel. They come in four kinds: `text`, `code`, `sheet`, and `image`.

- **Handler Pattern**: Each artifact kind has a "handler" (e.g., `codeDocumentHandler` in `artifacts/code/server.ts`).
- **Secondary Streaming**: When `createDocument` is executed, it identifies the correct handler. The handler then initiates a **separate** `streamText` call with a specialized prompt (e.g., `codePrompt`). 
- **Metadata Streaming**: Handlers use `dataStream.write` with specific data types (`data-kind`, `data-id`, `data-title`, `data-codeDelta`) to update the UI without waiting for the full generation to finish.

### 4. Data Persistence
- **Chats & Messages**: Saved in PostgreSQL via Drizzle (see `lib/db/queries.ts`).
- **Documents**: Artifacts are saved to the `documents` table once generation finishes.
- **Resumable Streams**: Uses Redis to allow streams to continue even if a connection is momentarily lost.

### 5. UI Components
- **Chat Interface**: Located in `app/(chat)/chat/[id]`.
- **Artifact Viewer**: Components in `components/chat/artifact.tsx` and kind-specific editors like `code-editor.tsx`, `text-editor.tsx`.
- **Stream Handler**: `data-stream-handler.tsx` listens for the custom `data-*` chunks from the server and updates the frontend state accordingly.

## Directory Structure Highlights
- `/app`: Next.js routes and API endpoints.
- `/artifacts`: Server-side and client-side logic for each artifact kind (code, sheet, text, image).
- `/components`: UI components, including the core chat and artifact systems.
- `/lib/ai`: AI-specific logic, prompts, and tool definitions.
- `/lib/db`: Database schema and query functions.
- `/docs`: Project documentation and context.
