# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

hazo_chat is a React/Next.js chat component library (v2.x) for 1-1 communication with document sharing. It uses an **API-first architecture** where all data access occurs through fetch() calls to Next.js API endpoints - no server-side dependencies in client components.

## Build Commands

```bash
npm run build          # TypeScript compilation (tsconfig.build.json)
npm run dev:package    # Watch mode for development
npm run dev:test-app   # Build package + run test app (full workflow)
npm run build:test-app # Production build of test app
```

## Code Style

**Naming Conventions:**
- Files: `snake_case` (e.g., `hazo_chat_input.tsx`)
- Variables/functions: `snake_case` (e.g., `send_message`, `user_id`)
- Components: `PascalCase` (e.g., `HazoChat`, `ChatBubble`)
- CSS class prefixes: `cls_` for custom component classes
- Types/interfaces: `PascalCase` (e.g., `ChatMessage`, `HazoChatProps`)

## Architecture

### Directory Structure

```
src/
├── api/               # Server-side API handler factories
│   ├── messages.ts    # createMessagesHandler, createMarkAsReadHandler, createDeleteHandler
│   ├── unread_count.ts # createUnreadCountFunction
│   └── types.ts       # API types (ApiErrorResponse, ApiSuccessResponse)
├── components/
│   ├── hazo_chat/     # Main component + sub-components (memoized)
│   └── ui/            # Reusable UI components (shadcn/ui style)
├── hooks/             # Custom React hooks
│   ├── use_chat_messages.ts   # Fetch, poll (with backoff), CRUD, profile caching
│   ├── use_chat_references.ts # Document reference management
│   └── use_file_upload.ts     # File validation and upload
├── lib/               # Constants and utilities
├── types/             # TypeScript interfaces + transport abstractions
└── index.ts           # Main package entry
```

### Component Hierarchy

```
HazoChat (wrapper with provider)
└── HazoChatProvider (context with useReducer)
    └── HazoChatInner
        ├── HazoChatHeader
        ├── HazoChatMessages (memoized, ScrollArea with infinite scroll)
        │   └── MemoizedChatBubble (per message)
        ├── HazoChatInput
        └── HazoChatSidebar (mobile)
            ├── HazoChatReferenceList
            └── HazoChatDocumentViewer
```

### Data Flow (API-First)

```
Client Component → useChatMessages hook → fetch('/api/hazo_chat/messages')
                                                    ↓
                                          API Handler (createMessagesHandler)
                                                    ↓
                                          hazo_connect (database)
```

No server-side imports in client code. All database access goes through API routes.

### Export Strategy

```typescript
// Main export - components, hooks, types
import { HazoChat, useChatMessages, ChatMessage } from 'hazo_chat';

// API handlers - server-side only
import { createMessagesHandler, createMarkAsReadHandler, createDeleteHandler } from 'hazo_chat/api';

// Components only
import { ChatBubble } from 'hazo_chat/components';

// Library utilities
import { DEFAULT_POLLING_INTERVAL, MIME_TYPE_MAP } from 'hazo_chat/lib';
```

## Key Files

| File | Purpose |
|------|---------|
| `src/components/hazo_chat/hazo_chat_context.tsx` | React context with useReducer for state |
| `src/hooks/use_chat_messages.ts` | Core hook: polling with exponential backoff, profile cache with TTL |
| `src/api/messages.ts` | Handler factories for GET/POST/DELETE with validation |
| `src/types/index.ts` | All TypeScript interfaces + RealtimeTransport abstraction |
| `src/lib/constants.ts` | Default config values, MIME types |

## Database Schema

Single table `hazo_chat` with fields:
- `id`, `reference_id`, `reference_type`
- `sender_user_id`, `receiver_user_id`
- `message_text`, `reference_list` (JSON array)
- `read_at`, `deleted_at`, `created_at`, `changed_at`

## Required API Endpoints

The component expects these endpoints (use handler factories):

| Endpoint | Method | Handler |
|----------|--------|---------|
| `/api/hazo_chat/messages` | GET, POST | `createMessagesHandler` |
| `/api/hazo_chat/messages/[id]` | DELETE | `createDeleteHandler` |
| `/api/hazo_chat/messages/[id]/read` | PATCH | `createMarkAsReadHandler` |
| `/api/hazo_auth/me` | GET | Returns current user |
| `/api/hazo_auth/profiles` | POST | Batch fetch user profiles |

## API Features

- **Pagination**: GET supports `limit`, `cursor`, `direction` params
- **Validation**: Message length (max 5000), reference_id/type length limits
- **Standardized errors**: `ApiErrorResponse` with `error_code` field
- **Soft delete**: DELETE sets `deleted_at`, clears `message_text`

## Polling & Real-time

- Uses `setTimeout`-based polling (not `setInterval`) for proper exponential backoff
- Backoff: `interval * 2^retryCount`, capped at 30s
- Profile cache with TTL (30 min) and max size (200 entries)
- Transport abstraction (`RealtimeTransport` interface) ready for WebSocket/SSE

## Dependencies

**Runtime:**
- `@radix-ui/*` (avatar, scroll-area, tooltip, etc.)
- `date-fns`, `date-fns-tz` (timestamps)
- `react-icons` (IoSend, IoClose, etc.)
- `hazo_config`, `hazo_pdf`

**Peer Dependencies:**
- `hazo_connect` ^2.3.1 (required for API handlers)
- `next` >=14.0.0
- `react`, `react-dom` ^18.0.0
- `tailwindcss` >=3.0.0

## Test App

Located in `test-app/` - full Next.js application demonstrating:
- API route setup with handler factories
- Component integration
- Tailwind CSS configuration
- CSS variable definitions
