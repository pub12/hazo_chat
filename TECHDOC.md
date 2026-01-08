# hazo_chat Technical Documentation

## System Architecture

hazo_chat is a group-based chat system built with React, Next.js, and PostgreSQL. The architecture follows an API-first design where client components communicate exclusively through REST API endpoints.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  HazoChat    │  │ useChatMsgs  │  │ useChatRefs  │      │
│  │  Component   │─→│    Hook      │  │    Hook      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                            ↓ fetch()                         │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     API Layer (Next.js)                      │
│  ┌───────────────────────────────────────────────────┐      │
│  │  /api/hazo_chat/messages                          │      │
│  │  - GET:  Fetch messages (chat_group_id required) │      │
│  │  - POST: Send message (chat_group_id required)   │      │
│  └───────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────┐      │
│  │  /api/hazo_chat/messages/[id]/read                │      │
│  │  - PATCH: Mark as read (group membership check)  │      │
│  └───────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────┐      │
│  │  /api/hazo_chat/unread_count                      │      │
│  │  - GET: Get unread counts by chat_group_id       │      │
│  └───────────────────────────────────────────────────┘      │
│                            │                                 │
│                            ↓                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                Database Layer (PostgreSQL)                   │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  hazo_chat_group    │  │  hazo_chat_group_   │          │
│  │  - id (PK)          │  │  users              │          │
│  │  - client_user_id   │  │  - chat_group_id    │          │
│  │  - name             │  │  - user_id          │          │
│  └─────────────────────┘  │  - role             │          │
│           │                └─────────────────────┘          │
│           │                         │                        │
│           └─────────────┬───────────┘                        │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────┐           │
│  │  hazo_chat                                   │           │
│  │  - id (PK)                                   │           │
│  │  - chat_group_id (FK → hazo_chat_group.id)  │           │
│  │  - sender_user_id (FK → hazo_users.id)      │           │
│  │  - message_text                              │           │
│  │  - reference_list (JSONB)                    │           │
│  │  - read_at, deleted_at                       │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Design

### Entity Relationship Diagram

```
hazo_users (1) ──────< (N) hazo_chat_group
                            (client_user_id)
                                   │
                                   │ (1)
                                   │
                                   │ (N)
hazo_users (N) ─────────< hazo_chat_group_users >──────── (N) hazo_chat_group
                                   │
                                   │
                            [role: client|staff]

hazo_chat_group (1) ──────< (N) hazo_chat
                            (chat_group_id)
                                   │
                            [sender_user_id FK]
```

### Table Specifications

#### hazo_chat_group

**Purpose:** Container for chat participants. Each group represents a conversation context.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique group identifier |
| client_user_id | UUID | NOT NULL, FK → hazo_users(id) | The fixed client user |
| name | VARCHAR(255) | NULL | Optional group name |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| changed_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Indexes:**
- `idx_hazo_chat_group_client` ON (client_user_id)

**Design Decisions:**
- `client_user_id` is the fixed client for the conversation
- Multiple staff can be added as group members
- Name is optional for internal identification

#### hazo_chat_group_users

**Purpose:** Junction table managing group membership and roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| chat_group_id | UUID | PRIMARY KEY (composite), FK → hazo_chat_group(id) CASCADE | Group reference |
| user_id | UUID | PRIMARY KEY (composite), FK → hazo_users(id) CASCADE | User reference |
| role | VARCHAR(20) | NOT NULL, CHECK (role IN ('client', 'staff')) | User role in group |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Join timestamp |
| changed_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Indexes:**
- `idx_hazo_chat_group_users_user` ON (user_id)
- `idx_hazo_chat_group_users_group` ON (chat_group_id)

**Design Decisions:**
- Composite primary key prevents duplicate memberships
- CASCADE delete ensures cleanup when group or user is deleted
- Role constraint enforces valid values at database level

#### hazo_chat

**Purpose:** Individual chat messages within groups.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique message identifier |
| reference_id | UUID | NOT NULL | Context reference (e.g., ticket, project) |
| reference_type | TEXT | DEFAULT 'chat', NOT NULL | Type of reference context |
| sender_user_id | UUID | NOT NULL, FK → hazo_users(id) | Message sender |
| chat_group_id | UUID | NOT NULL, FK → hazo_chat_group(id) | Target group |
| message_text | TEXT | NULL | Message content (null when deleted) |
| reference_list | JSONB | NULL | Attached documents/references |
| read_at | TIMESTAMPTZ | NULL | Mark-as-read timestamp |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| changed_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Indexes:**
- `idx_hazo_chat_reference_id` ON (reference_id)
- `idx_hazo_chat_sender` ON (sender_user_id)
- `idx_hazo_chat_group` ON (chat_group_id)
- `idx_hazo_chat_created` ON (created_at DESC)
- `idx_hazo_chat_reference_type` ON (reference_type)
- `idx_hazo_chat_read_at` ON (read_at) WHERE read_at IS NOT NULL
- `idx_hazo_chat_deleted_at` ON (deleted_at) WHERE deleted_at IS NOT NULL

**Design Decisions:**
- JSONB for `reference_list` allows flexible document metadata storage
- Soft delete preserves message history while hiding content
- Partial indexes optimize queries for unread/deleted messages
- DESC index on created_at optimizes recent message queries

## API Specifications

### Authentication & Authorization

All API endpoints require authentication. The system verifies:

1. User is authenticated (via `hazo_auth_user_id` cookie or custom auth)
2. User is a member of the chat group (for group-specific operations)

### Endpoint: GET /api/hazo_chat/messages

**Purpose:** Fetch chat messages for a group with cursor-based pagination.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_group_id | UUID | Yes | Chat group identifier |
| limit | number | No | Messages per page (default: 20) |
| cursor | UUID | No | Last message ID for pagination |
| direction | 'before' \| 'after' | No | Pagination direction (default: 'before') |
| reference_id | UUID | No | Filter by reference |
| reference_type | string | No | Filter by reference type |

**Response:**
```typescript
{
  success: true,
  messages: ChatMessage[],
  current_user_id: string,
  has_more: boolean,
  next_cursor: string | null
}
```

**Authorization:**
- Verifies user is a member of `chat_group_id`
- Returns 403 if not a member

### Endpoint: POST /api/hazo_chat/messages

**Purpose:** Send a new message to a group.

**Request Body:**
```typescript
{
  chat_group_id: string;      // Required
  reference_id: string;       // Required
  reference_type?: string;    // Optional, default: 'chat'
  message_text: string;       // Required, max 5000 chars
  reference_list?: Array<{    // Optional
    id: string;
    type: 'document' | 'field' | 'url';
    scope: 'chat' | 'field';
    name: string;
    url: string;
    mime_type?: string;
    file_size?: number;
  }>;
}
```

**Response:**
```typescript
{
  success: true,
  message: ChatMessage
}
```

**Validation:**
- Message text max 5000 characters
- chat_group_id, reference_id max 255 characters
- User must be a member of the group

### Endpoint: PATCH /api/hazo_chat/messages/[id]/read

**Purpose:** Mark a message as read (called automatically by UI).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Message identifier |

**Response:**
```typescript
{
  success: true
}
```

**Authorization:**
- User must be a member of the message's chat group
- User cannot mark their own messages as read
- Sets `read_at` timestamp to NOW()

### Endpoint: GET /api/hazo_chat/unread_count

**Purpose:** Get unread message counts grouped by chat_group_id.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | UUID | Yes | User to get counts for |
| chat_group_ids | string | No | Comma-separated group IDs to filter |

**Response:**
```typescript
{
  success: true,
  user_id: string,
  unread_counts: Array<{
    chat_group_id: string,
    count: number
  }>,
  total_groups: number,
  total_unread: number
}
```

**Behavior:**
- Only counts messages in groups where user is a member
- Only counts messages with `read_at IS NULL` and `deleted_at IS NULL`
- Excludes messages sent by the requesting user
- Results sorted by count DESC (most unread first)

## Data Flow Patterns

### Message Sending Flow

```
User Input
    │
    ↓
useChatMessages.send_message()
    │
    ↓ (Optimistic Update)
Add to local state with status: 'sending'
    │
    ↓
POST /api/hazo_chat/messages
    │
    ├─ Success → Update local message with server data
    │              status: 'sent'
    │
    └─ Error → Update local message
                  status: 'failed'
                  Show error toast
```

### Message Reading Flow (Automatic)

```
Message Scrolled into View (50% visible)
    │
    ↓
Intersection Observer triggers
    │
    ↓
Check: Is current user the receiver?
    │   (not the sender)
    ↓
Check: Message not already marked as read
    │
    ↓
PATCH /api/hazo_chat/messages/[id]/read
    │
    ├─ Success → Update local message.read_at
    │              Update UI (show green checkmark)
    │
    └─ Error → Silent failure (no user notification)
```

### Polling & Real-time Updates

```
Component Mount
    │
    ↓
Initial Fetch (GET /api/hazo_chat/messages)
    │
    ↓
Start Polling Timer (if realtime_mode = 'polling')
    │
    ├─→ setTimeout(interval)
    │       │
    │       ↓
    │   Fetch Latest Messages
    │       │
    │       ├─ Success → Reset retry count
    │       │             Restart timer
    │       │
    │       └─ Error → Increment retry count
    │                   Exponential backoff: interval * 2^retryCount
    │                   Restart timer (capped at 30s)
    │
    └─→ Component Unmount → Clear timer
```

### Profile Caching Strategy

```
Message Fetch Returns sender_user_ids
    │
    ↓
Check Cache for Each User
    │
    ├─→ Cache Hit → Use cached profile
    │                 Check TTL (30 min)
    │
    └─→ Cache Miss → Batch fetch profiles
                      POST /api/hazo_auth/profiles
                      Store in cache with timestamp
                      │
                      └─→ If cache size > 200 → Evict oldest
```

## Performance Optimizations

### Database Query Optimization

1. **Indexed Queries:**
   - All WHERE clauses use indexed columns
   - Partial indexes for `read_at` and `deleted_at`
   - Composite indexes for common query patterns

2. **Query Patterns:**
   ```sql
   -- Optimized: Uses idx_hazo_chat_group + idx_hazo_chat_created
   SELECT * FROM hazo_chat
   WHERE chat_group_id = $1
     AND deleted_at IS NULL
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **JOIN Optimization:**
   ```sql
   -- Fetch messages with group membership check
   SELECT hc.* FROM hazo_chat hc
   INNER JOIN hazo_chat_group_users hcgu
     ON hcgu.chat_group_id = hc.chat_group_id
   WHERE hc.chat_group_id = $1
     AND hcgu.user_id = $2  -- Membership check
     AND hc.deleted_at IS NULL
   ORDER BY hc.created_at DESC;
   ```

### React Component Optimization

1. **Memoization:**
   ```typescript
   // ChatBubble component is memoized
   const MemoizedChatBubble = React.memo(ChatBubble);

   // Only re-renders if message content changes
   ```

2. **useReducer for State:**
   - Single state update for multiple operations
   - Prevents unnecessary re-renders
   - Atomic state updates

3. **Intersection Observer:**
   - Efficient visibility detection
   - Single observer for all messages
   - Automatic cleanup on unmount

### API Response Caching

1. **Profile Cache:**
   - In-memory LRU cache (max 200 entries)
   - TTL: 30 minutes
   - Reduces redundant profile fetches

2. **Polling Backoff:**
   - Exponential backoff on errors
   - Prevents API flooding
   - Caps at 30 second interval

## Security Considerations

### Authentication

- All endpoints require valid user session
- Cookies: `hazo_auth_user_id` (httpOnly, secure, sameSite)
- Custom auth can be implemented via `getUserIdFromRequest` option

### Authorization

- Group membership checked for all message operations
- Users can only:
  - Read messages in groups they belong to
  - Send messages to groups they belong to
  - Mark messages as read in groups they belong to

### Input Validation

```typescript
// Message text validation
if (message_text.length > 5000) {
  return { error: 'Message too long' };
}

// SQL injection prevention
// Uses parameterized queries via hazo_connect
query('SELECT * FROM hazo_chat WHERE id = ?', [message_id]);
```

### XSS Prevention

- All user input sanitized before rendering
- React automatically escapes JSX content
- URL validation for document references

### Data Privacy

- Soft delete preserves audit trail
- Deleted messages clear `message_text` but keep metadata
- Profile data cached with TTL to respect privacy changes

## Error Handling

### API Error Responses

Standardized format:
```typescript
{
  success: false,
  error: string,           // Human-readable message
  error_code?: string,     // Machine-readable code
  details?: any            // Additional error context
}
```

### Client-Side Error Handling

```typescript
// Network errors
try {
  const response = await fetch(...);
} catch (error) {
  polling_status = 'error';
  exponential_backoff();
}

// API errors
if (!response.ok) {
  const error = await response.json();
  toast.error(error.error);
}
```

### Error Recovery

- Automatic retry with exponential backoff
- Optimistic updates rollback on failure
- User notifications via toast messages
- Silent failures for non-critical operations (mark-as-read)

## Testing Strategies

### Unit Tests

- Test individual hooks with React Testing Library
- Mock fetch calls with MSW (Mock Service Worker)
- Test state reducers in isolation

### Integration Tests

- Test complete user flows (send → receive → read)
- Test API endpoints with test database
- Test group membership authorization

### E2E Tests

- Test real-time message updates
- Test pagination and infinite scroll
- Test document attachment workflow

## Migration Path (v2.x → v3.0)

### Database Migration Script

```sql
-- Step 1: Create new tables
CREATE TABLE hazo_chat_group (...);
CREATE TABLE hazo_chat_group_users (...);

-- Step 2: Migrate existing 1-1 chats to groups
WITH unique_conversations AS (
  SELECT DISTINCT
    sender_user_id,
    receiver_user_id,
    MIN(created_at) as first_message
  FROM hazo_chat
  GROUP BY sender_user_id, receiver_user_id
)
INSERT INTO hazo_chat_group (id, client_user_id, name)
SELECT
  gen_random_uuid(),
  receiver_user_id,
  'Migrated: ' || sender_user_id || ' → ' || receiver_user_id
FROM unique_conversations;

-- Step 3: Add group members
INSERT INTO hazo_chat_group_users (chat_group_id, user_id, role)
SELECT
  g.id,
  uc.sender_user_id,
  'staff'
FROM unique_conversations uc
JOIN hazo_chat_group g ON g.client_user_id = uc.receiver_user_id;

INSERT INTO hazo_chat_group_users (chat_group_id, user_id, role)
SELECT
  g.id,
  uc.receiver_user_id,
  'client'
FROM unique_conversations uc
JOIN hazo_chat_group g ON g.client_user_id = uc.receiver_user_id;

-- Step 4: Add temporary column
ALTER TABLE hazo_chat ADD COLUMN chat_group_id_new UUID;

-- Step 5: Populate chat_group_id
UPDATE hazo_chat hc
SET chat_group_id_new = (
  SELECT g.id
  FROM hazo_chat_group g
  WHERE g.client_user_id = hc.receiver_user_id
  LIMIT 1
);

-- Step 6: Drop old column and rename
ALTER TABLE hazo_chat DROP COLUMN receiver_user_id;
ALTER TABLE hazo_chat RENAME COLUMN chat_group_id_new TO chat_group_id;

-- Step 7: Add constraints
ALTER TABLE hazo_chat
  ALTER COLUMN chat_group_id SET NOT NULL,
  ADD CONSTRAINT fk_hazo_chat_group
    FOREIGN KEY (chat_group_id)
    REFERENCES hazo_chat_group(id);

-- Step 8: Recreate indexes
DROP INDEX IF EXISTS idx_hazo_chat_receiver;
CREATE INDEX idx_hazo_chat_group ON hazo_chat(chat_group_id);
```

### Application Code Migration

1. Update all `receiver_user_id` props to `chat_group_id`
2. Update API calls to use `chat_group_id` parameter
3. Remove `receiver_profile` field access
4. Update unread count logic to group by `chat_group_id`

## Deployment Considerations

### Database

- Run migration scripts during maintenance window
- Backup database before migration
- Test migration on staging environment
- Monitor query performance after migration

### Application

- Feature flag for gradual rollout
- Monitor error rates during deployment
- Have rollback plan ready
- Update API documentation

### Monitoring

- Track API response times
- Monitor group membership queries
- Alert on elevated error rates
- Track message delivery success rate

---

## Component Rendering Behavior

### Conditional Rendering

The `HazoChatInput` component is conditionally rendered based on the `read_only` prop:

```typescript
// In HazoChatInner component
{!read_only && (
  <div className="cls_input_row border-t bg-background">
    <HazoChatInput ... />
  </div>
)}
```

When `read_only={true}`:
- Chat input area is completely hidden
- Users can view messages but cannot send new ones
- Useful for archived conversations, audit views, or read-only access

---

**Document Version:** 4.0.4
**Last Updated:** 2026-01-08
**Maintained By:** hazo_chat development team
