# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

hazo_chat is a React/Next.js chat component library (v3.x) for group-based communication with document sharing. It uses an **API-first architecture** where all data access occurs through fetch() calls to Next.js API endpoints - no server-side dependencies in client components.

**Architecture:** Group-based chat supporting multiple users in a single chat group. Designed for scenarios where multiple support staff can rotate on a single client chat session.

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

### PostgreSQL Enum Types (hazo_enum_)

For PostgreSQL, the following enum types are available:

```sql
-- Reference type for chat contexts
CREATE TYPE hazo_enum_chat_type AS ENUM ('chat', 'field', 'project', 'support', 'general');

-- Group type for conversation patterns (v3.1)
CREATE TYPE hazo_enum_group_type AS ENUM ('support', 'peer', 'group');

-- Membership roles (v3.1)
CREATE TYPE hazo_enum_group_role AS ENUM ('client', 'staff', 'owner', 'admin', 'member');
```

### hazo_chat_group (UPDATED in v3.1)
Group container for chat participants:
- `id` (UUID) - Group identifier
- `client_user_id` (UUID, FK → hazo_users.id, **NULLABLE**) - The fixed client (for support groups only)
- `group_type` ('support' | 'peer' | 'group') - **NEW in v3.1**: Type of conversation
- `name` (varchar, optional) - Group name
- `created_at`, `changed_at` (timestamps)

**Group Types:**
- `'support'`: Client-to-staff support conversation (has designated client)
- `'peer'`: Peer-to-peer direct message (1:1, no fixed client)
- `'group'`: Multi-user group conversation (no fixed client)

### hazo_chat_group_users (UPDATED in v3.1)
Group membership and roles:
- `chat_group_id` (UUID, FK → hazo_chat_group.id)
- `user_id` (UUID, FK → hazo_users.id)
- `role` ('client' | 'staff' | 'owner' | 'admin' | 'member') - **EXPANDED in v3.1**
- `created_at`, `changed_at` (timestamps)
- PRIMARY KEY (chat_group_id, user_id)

**Role Types:**
- `'client'`: Customer/end-user in support scenarios
- `'staff'`: Support personnel in support scenarios
- `'owner'`: Creator of peer/group chats
- `'admin'`: Delegated administrator in group chats
- `'member'`: Standard participant in peer/group chats

### hazo_chat (MODIFIED in v3.0)
Chat messages table:
- `id`, `reference_id`, `reference_type`
- `sender_user_id` (UUID, FK → hazo_users.id)
- `chat_group_id` (UUID, FK → hazo_chat_group.id) - **CHANGED from receiver_user_id**
- `message_text`, `reference_list` (JSONB array)
- `read_at`, `deleted_at`, `created_at`, `changed_at`

## Required API Endpoints

The component expects these endpoints (use handler factories):

| Endpoint | Method | Handler | Query/Body Params |
|----------|--------|---------|-------------------|
| `/api/hazo_chat/messages` | GET | `createMessagesHandler` | `chat_group_id` (required) |
| `/api/hazo_chat/messages` | POST | `createMessagesHandler` | `{ chat_group_id, message_text, ... }` |
| `/api/hazo_chat/messages/[id]` | DELETE | `createDeleteHandler` | - |
| `/api/hazo_chat/messages/[id]/read` | PATCH | `createMarkAsReadHandler` | - |
| `/api/hazo_auth/me` | GET | Returns current user | - |
| `/api/hazo_auth/profiles` | POST | Batch fetch user profiles | `{ user_ids: [...] }` |

**Breaking Change (v3.0):** GET/POST messages now use `chat_group_id` instead of `receiver_user_id`.

## API Features

- **Group Membership**: All endpoints verify user is a member of the chat group
- **Pagination**: GET supports `limit`, `cursor`, `direction` params
- **Validation**: Message length (max 5000), reference_id/type length limits
- **Standardized errors**: `ApiErrorResponse` with `error_code` field
- **Soft delete**: DELETE sets `deleted_at`, clears `message_text`
- **Read Receipts**: Any group member (except sender) can mark messages as read

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

## Component Props (Breaking Changes in v3.0)

**HazoChat component:**
- `chat_group_id` (string, required) - **CHANGED from `receiver_user_id`**
- `reference_id`, `reference_type` (unchanged)
- All other props remain the same

**useChatMessages hook:**
- `chat_group_id` (string, required) - **CHANGED from `receiver_user_id`**
- All other params remain the same

**Type Changes (v3.0):**
- `ChatMessage`: Removed `receiver_profile` field
- `CreateMessagePayload`: `chat_group_id` replaces `receiver_user_id`
- NEW: `ChatGroup`, `ChatGroupUser`, `ChatGroupWithMembers` types
- NEW: `ChatGroupUserRole` type: 'client' | 'staff'

**Type Changes (v3.1 - Generic Schema):**
- `ChatGroup.client_user_id`: Changed from required to optional (nullable)
- NEW: `ChatGroupType` type: 'support' | 'peer' | 'group'
- NEW: `ChatGroup.group_type` field
- `ChatGroupUserRole`: EXPANDED to include 'owner' | 'admin' | 'member'
- `ChatGroupWithMembers`: Added `owner_profile` field

## Unread Count Function Changes (v3.0)

**Function signature changed:**
```typescript
// v2.x
createUnreadCountFunction({ user_id: string })

// v3.0
createUnreadCountFunction({ user_id: string, chat_group_ids?: string[] })
```

**Return format changed:**
- Now groups by `chat_group_id` instead of `reference_id`
- Returns `{ chat_group_id: string, count: number }[]`

## Test App

Located in `test-app/` - full Next.js application demonstrating:
- API route setup with handler factories
- Component integration
- Tailwind CSS configuration
- CSS variable definitions
