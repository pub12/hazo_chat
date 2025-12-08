# hazo_chat Setup Checklist (v3.0)

A comprehensive, step-by-step guide for setting up hazo_chat in a Next.js project. This checklist is designed for both AI assistants and human developers.

**Version 3.0 Changes:** This version introduces group-based chat architecture. See [Migration from v2.x](#migration-from-v2x-to-v30) section for upgrade instructions.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Package Installation](#2-package-installation)
3. [Database Setup](#3-database-setup)
4. [API Routes](#4-api-routes)
5. [Component Integration](#5-component-integration)
6. [UI Components and Styling Setup](#6-ui-components-and-styling-setup)
7. [Configuration (Optional)](#7-configuration-optional)
8. [UI Design Standards Compliance](#8-ui-design-standards-compliance)
9. [Verification Checklist](#9-verification-checklist)
10. [Troubleshooting](#10-troubleshooting)
11. [Migration from v2.x to v3.0](#migration-from-v2x-to-v30)
12. [Migration from v3.0 to v3.1](#migration-from-v30-to-v31-generic-schema)

---

## 1. Prerequisites

### Required Software
- [ ] Node.js >= 18.0.0
- [ ] npm >= 9.0.0 or yarn >= 1.22.0
- [ ] Next.js >= 14.0.0 (App Router)

### Required Knowledge
- React and Next.js fundamentals
- Basic understanding of REST APIs
- TypeScript basics

---

## 2. Package Installation

### Step 2.1: Install Core Packages

```bash
npm install hazo_chat hazo_connect
```

### Step 2.2: Install Peer Dependencies (if not already installed)

```bash
npm install react react-dom next
```

### Verification
- [ ] `package.json` contains `hazo_chat` and `hazo_connect`
- [ ] No npm installation errors
- [ ] `node_modules/hazo_chat` exists

---

## 3. Database Setup

### Step 3.1: PostgreSQL Setup (Recommended)

For PostgreSQL databases, follow these steps to create the schema with UUID types, enums, and proper defaults.

#### Step 3.1.1: Enable UUID Extension

First, enable the UUID extension for generating UUIDs:

```sql
-- Enable UUID extension (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- OR for PostgreSQL 13+, use pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### Step 3.1.2: Create Enum Types (Recommended)

Create enum types for data integrity. All enums are prefixed with `hazo_enum_`:

```sql
-- ============================================================================
-- ENUM TYPE DEFINITIONS (PostgreSQL)
-- ============================================================================

-- 1. Reference type enum - for categorizing chat contexts
CREATE TYPE hazo_enum_chat_type AS ENUM (
  'chat',      -- General chat
  'field',     -- Form field reference
  'project',   -- Project-related
  'support',   -- Support ticket
  'general'    -- General purpose
);

-- 2. Group type enum (v3.1) - for identifying conversation patterns
CREATE TYPE hazo_enum_group_type AS ENUM (
  'support',   -- Client-to-staff support conversation
  'peer',      -- Peer-to-peer direct message (1:1)
  'group'      -- Multi-user group conversation
);

-- 3. Group user role enum (v3.1) - for membership roles
CREATE TYPE hazo_enum_group_role AS ENUM (
  'client',    -- Customer/end-user in support scenarios
  'staff',     -- Support personnel in support scenarios
  'owner',     -- Creator of peer/group chats
  'admin',     -- Delegated administrator in group chats
  'member'     -- Standard participant in peer/group chats
);

-- Note: To add new enum values later, use:
-- ALTER TYPE hazo_enum_chat_type ADD VALUE 'new_value';
-- ALTER TYPE hazo_enum_group_type ADD VALUE 'new_value';
-- ALTER TYPE hazo_enum_group_role ADD VALUE 'new_value';
```

#### Step 3.1.3: Create hazo_chat_group Table (UPDATED in v3.1)

Create the chat group container table:

```sql

-- hazo_chat_group table for group-based chat (PostgreSQL)
-- UPDATED in v3.1: client_user_id is now nullable, added group_type
CREATE TABLE IF NOT EXISTS hazo_chat_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID REFERENCES hazo_users(id),  -- Nullable for peer/group chats
  group_type hazo_enum_group_type DEFAULT 'support',  -- Type of conversation
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_client ON hazo_chat_group(client_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_type ON hazo_chat_group(group_type);
```

**Group Types:**
- `'support'`: Client-to-staff support conversation (has designated `client_user_id`)
- `'peer'`: Peer-to-peer direct message (1:1, no `client_user_id`)
- `'group'`: Multi-user group conversation (no `client_user_id`)

#### Step 3.1.4: Create hazo_chat_group_users Table (UPDATED in v3.1)

Create the group membership table:

```sql
-- hazo_chat_group_users table for group membership (PostgreSQL)
-- UPDATED in v3.1: uses hazo_enum_group_role enum type
CREATE TABLE IF NOT EXISTS hazo_chat_group_users (
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES hazo_users(id) ON DELETE CASCADE,
  role hazo_enum_group_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_group_id, user_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_users_user ON hazo_chat_group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_users_group ON hazo_chat_group_users(chat_group_id);
```

**Alternative: Without Enum Type (More Flexible)**

If you prefer flexibility over strict enum validation:

```sql
-- hazo_chat_group_users table with VARCHAR role (more flexible)
CREATE TABLE IF NOT EXISTS hazo_chat_group_users (
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES hazo_users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'staff', 'owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_group_id, user_id)
);
```

**Role Types:**
- `'client'`: Customer/end-user in support scenarios
- `'staff'`: Support personnel in support scenarios
- `'owner'`: Creator of peer/group chats
- `'admin'`: Delegated administrator in group chats
- `'member'`: Standard participant in peer/group chats

#### Step 3.1.5: Create hazo_chat Table (MODIFIED in v3.0)

Create the chat messages table with UUID types and proper defaults:

```sql
-- hazo_chat table for storing chat messages (PostgreSQL)
-- MODIFIED in v3.0: receiver_user_id replaced with chat_group_id
CREATE TABLE IF NOT EXISTS hazo_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID NOT NULL,
  reference_type hazo_enum_chat_type DEFAULT 'chat' NOT NULL,
  sender_user_id UUID NOT NULL,
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id),  -- CHANGED from receiver_user_id
  message_text TEXT,
  reference_list JSONB,
  read_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_id ON hazo_chat(reference_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_sender ON hazo_chat(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group ON hazo_chat(chat_group_id);  -- CHANGED from receiver index
CREATE INDEX IF NOT EXISTS idx_hazo_chat_created ON hazo_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_type ON hazo_chat(reference_type);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_read_at ON hazo_chat(read_at) WHERE read_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hazo_chat_deleted_at ON hazo_chat(deleted_at) WHERE deleted_at IS NOT NULL;
```

**Alternative: Without Enum Type (More Flexible)**

If you prefer flexibility over strict enum validation:

```sql
-- hazo_chat table with TEXT reference_type (more flexible)
-- MODIFIED in v3.0: receiver_user_id replaced with chat_group_id
CREATE TABLE IF NOT EXISTS hazo_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID NOT NULL,
  reference_type TEXT DEFAULT 'chat' NOT NULL,
  sender_user_id UUID NOT NULL,
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id),  -- CHANGED from receiver_user_id
  message_text TEXT,
  reference_list JSONB,
  read_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_id ON hazo_chat(reference_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_sender ON hazo_chat(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group ON hazo_chat(chat_group_id);  -- CHANGED from receiver index
CREATE INDEX IF NOT EXISTS idx_hazo_chat_created ON hazo_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_type ON hazo_chat(reference_type);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_read_at ON hazo_chat(read_at) WHERE read_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hazo_chat_deleted_at ON hazo_chat(deleted_at) WHERE deleted_at IS NOT NULL;
```

#### Step 3.1.4: Ensure Users Table Exists (PostgreSQL)

You need a users table with at least these fields:

```sql
-- Users table for PostgreSQL
CREATE TABLE IF NOT EXISTS hazo_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_hazo_users_email ON hazo_users(email_address);
CREATE INDEX IF NOT EXISTS idx_hazo_users_active ON hazo_users(is_active) WHERE is_active = TRUE;
```

#### Step 3.1.6: Add Foreign Key Constraints (Optional)

Add foreign key constraints for referential integrity:

```sql
-- Add foreign key constraints (optional but recommended)
-- MODIFIED in v3.0: receiver_user_id constraint replaced with chat_group_id
ALTER TABLE hazo_chat
  ADD CONSTRAINT fk_hazo_chat_sender
    FOREIGN KEY (sender_user_id)
    REFERENCES hazo_users(id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_hazo_chat_group
    FOREIGN KEY (chat_group_id)
    REFERENCES hazo_chat_group(id)
    ON DELETE CASCADE;
```

### Step 3.2: SQLite Setup (Alternative)

For SQLite databases (development/testing), use this simplified schema.

#### Step 3.2.1: Create hazo_users Table (SQLite)

```sql
-- Users table for SQLite
CREATE TABLE IF NOT EXISTS hazo_users (
  id TEXT PRIMARY KEY,
  email_address TEXT UNIQUE NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_hazo_users_email ON hazo_users(email_address);
```

#### Step 3.2.2: Create hazo_chat_group Table (SQLite - UPDATED in v3.1)

```sql
-- hazo_chat_group table for group-based chat (SQLite)
-- UPDATED in v3.1: client_user_id is now nullable, added group_type
CREATE TABLE IF NOT EXISTS hazo_chat_group (
  id TEXT PRIMARY KEY,
  client_user_id TEXT,  -- Nullable for peer/group chats
  group_type TEXT DEFAULT 'support' CHECK (group_type IN ('support', 'peer', 'group')),
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_user_id) REFERENCES hazo_users(id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_client ON hazo_chat_group(client_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_type ON hazo_chat_group(group_type);
```

**Group Types:**
- `'support'`: Client-to-staff support conversation
- `'peer'`: Peer-to-peer direct message (1:1)
- `'group'`: Multi-user group conversation

#### Step 3.2.3: Create hazo_chat_group_users Table (SQLite - UPDATED in v3.1)

```sql
-- hazo_chat_group_users table for group membership (SQLite)
-- UPDATED in v3.1: expanded role options
CREATE TABLE IF NOT EXISTS hazo_chat_group_users (
  chat_group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff', 'owner', 'admin', 'member')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (chat_group_id, user_id),
  FOREIGN KEY (chat_group_id) REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES hazo_users(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_users_user ON hazo_chat_group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_users_group ON hazo_chat_group_users(chat_group_id);
```

**Role Types:**
- `'client'`: Customer/end-user in support scenarios
- `'staff'`: Support personnel in support scenarios
- `'owner'`: Creator of peer/group chats
- `'admin'`: Delegated administrator in group chats
- `'member'`: Standard participant in peer/group chats

#### Step 3.2.4: Create hazo_chat Table (SQLite - MODIFIED in v3.0)

```sql
-- hazo_chat table for storing chat messages (SQLite)
-- MODIFIED in v3.0: receiver_user_id replaced with chat_group_id
CREATE TABLE IF NOT EXISTS hazo_chat (
  id TEXT PRIMARY KEY,
  reference_id TEXT NOT NULL,
  reference_type TEXT DEFAULT 'chat',
  sender_user_id TEXT NOT NULL,
  chat_group_id TEXT NOT NULL,
  message_text TEXT,
  reference_list TEXT,
  read_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sender_user_id) REFERENCES hazo_users(id),
  FOREIGN KEY (chat_group_id) REFERENCES hazo_chat_group(id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_id ON hazo_chat(reference_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_sender ON hazo_chat(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group ON hazo_chat(chat_group_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_created ON hazo_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_type ON hazo_chat(reference_type);
```

### Step 3.3: Key Differences Between PostgreSQL and SQLite

| Feature | PostgreSQL | SQLite |
|---------|-----------|--------|
| **ID Type** | `UUID` with `gen_random_uuid()` default | `TEXT` (manual UUID generation) |
| **Boolean** | `BOOLEAN` type with `TRUE`/`FALSE` | `INTEGER` with `0`/`1` |
| **Timestamp** | `TIMESTAMPTZ` with `NOW()` default | `TEXT` with `datetime('now')` |
| **JSON** | `JSONB` type (binary JSON) | `TEXT` (JSON string) |
| **Enum** | Native `ENUM` type available | Not supported (use TEXT) |
| **Extensions** | Requires UUID extension | No extensions needed |

#### Step 3.3.1: Verify PostgreSQL Setup

Run these queries to verify your PostgreSQL setup:

```sql
-- Verify UUID extension is enabled
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Verify enum type exists (if using enum)
SELECT typname FROM pg_type WHERE typname = 'hazo_chat_reference_type';

-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'hazo_chat'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'hazo_chat';

-- Test UUID generation
SELECT gen_random_uuid() AS test_uuid;

-- Test table insert with defaults (v3.0 - uses chat_group_id)
-- First ensure you have a chat group and the user is a member
INSERT INTO hazo_chat (
  reference_id,
  sender_user_id,
  chat_group_id,
  message_text
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM hazo_users LIMIT 1),  -- Use existing user ID
  (SELECT id FROM hazo_chat_group LIMIT 1),  -- Use existing chat group ID
  'Test message'
);

-- Verify auto-generated values
SELECT 
  id,
  created_at,
  changed_at,
  reference_type
FROM hazo_chat 
WHERE message_text = 'Test message'
LIMIT 1;

-- Clean up test data
DELETE FROM hazo_chat WHERE message_text = 'Test message';
```

### Verification

**PostgreSQL:**
- [ ] UUID extension enabled (`uuid-ossp` or `pgcrypto`)
- [ ] Enum type created (if using enum approach)
- [ ] `hazo_users` table exists with UUID primary key
- [ ] `hazo_chat_group` table exists (v3.0)
- [ ] `hazo_chat_group_users` table exists (v3.0)
- [ ] `hazo_chat` table exists with `chat_group_id` column (v3.0)
- [ ] All indexes created successfully
- [ ] Can query: `SELECT * FROM hazo_chat LIMIT 1`
- [ ] UUID default generation works: `INSERT INTO hazo_chat (...) VALUES (...)` generates UUID automatically
- [ ] Timestamp defaults work: `created_at` and `changed_at` auto-populate

**SQLite:**
- [ ] `hazo_users` table exists
- [ ] `hazo_chat_group` table exists (v3.0)
- [ ] `hazo_chat_group_users` table exists (v3.0)
- [ ] `hazo_chat` table exists with `chat_group_id` column (v3.0)
- [ ] At least one user exists in database
- [ ] At least one chat group exists with memberships
- [ ] Can query: `SELECT * FROM hazo_chat LIMIT 1`

---

## 4. API Routes

Create the following API routes in your Next.js app:

### Step 4.1: Messages API (Using Exportable Handler)

**File: `src/app/api/hazo_chat/messages/route.ts`**

```typescript
/**
 * API route for chat message operations
 * Uses the exportable handler from hazo_chat
 */

import { createMessagesHandler } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

export const dynamic = 'force-dynamic';

const { GET, POST } = createMessagesHandler({
  getHazoConnect: () => getHazoConnectSingleton()
});

export { GET, POST };
```

### Step 4.1.5: Mark as Read API (Automatic Read Receipts)

**File: `src/app/api/hazo_chat/messages/[id]/read/route.ts`**

```typescript
/**
 * API route to mark a chat message as read
 * Uses the exportable handler from hazo_chat package
 * Supports PATCH for marking messages as read
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createMarkAsReadHandler } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

// Create handler using the exportable factory from hazo_chat
const { PATCH: patchHandler } = createMarkAsReadHandler({
  getHazoConnect: () => getHazoConnectSingleton()
});

// Wrapper to handle Next.js App Router params
async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  return patchHandler(request, context);
}

export { PATCH };
```

**Note:** This endpoint is called automatically by the `HazoChat` component when messages become visible in the viewport. It uses the Intersection Observer API to detect visibility and marks messages as read when they are at least 50% visible.

### Step 4.2: Auth Me API

**File: `src/app/api/hazo_auth/me/route.ts`**

```typescript
/**
 * API route to get current authenticated user
 * Adapt this to your authentication system
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const user_id = cookieStore.get('hazo_auth_user_id')?.value;

    if (!user_id) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    // TODO: Fetch user from your database
    // const user = await fetchUserById(user_id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user_id,
        name: 'User Name', // Replace with actual user data
        email: 'user@example.com',
        profile_picture_url: null
      }
    });
  } catch (error) {
    console.error('[hazo_auth/me] Error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  }
}
```

### Step 4.3: User Profiles API

**File: `src/app/api/hazo_auth/profiles/route.ts`**

```typescript
/**
 * API route to fetch user profiles by IDs
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createCrudService } from 'hazo_connect/server';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_ids } = body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'user_ids array is required' },
        { status: 400 }
      );
    }

    const hazoConnect = getHazoConnectSingleton();
    const usersService = createCrudService(hazoConnect, 'hazo_users');

    const users = await usersService.list((query) =>
      query.whereIn('id', user_ids)
    );

    const profiles = users.map((user) => ({
      id: user.id as string,
      name: (user.name as string) || (user.email_address as string)?.split('@')[0] || 'User',
      email: user.email_address as string,
      avatar_url: user.profile_picture_url as string | undefined,
    }));

    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error('[hazo_auth/profiles] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}
```

### Step 4.4: Unread Count API (Optional - For Unread Badges)

**File: `src/app/api/hazo_chat/unread_count/route.ts`**

This endpoint is optional but useful for displaying unread message counts or badges in your UI.

```typescript
/**
 * API route to get unread message counts grouped by chat_group_id
 * Uses the exportable library function from hazo_chat
 * MODIFIED in v3.0: Now uses user_id and optional chat_group_ids
 */

export const dynamic = 'force-dynamic';

import { createUnreadCountFunction } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
import { NextRequest, NextResponse } from 'next/server';

// Create the unread count function using the factory
const hazo_chat_get_unread_count = createUnreadCountFunction({
  getHazoConnect: () => getHazoConnectSingleton()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const chat_group_ids_param = searchParams.get('chat_group_ids');

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'user_id is required',
          unread_counts: []
        },
        { status: 400 }
      );
    }

    // Parse optional chat_group_ids (comma-separated)
    const chat_group_ids = chat_group_ids_param
      ? chat_group_ids_param.split(',').filter(Boolean)
      : undefined;

    // Call the library function
    const unread_counts = await hazo_chat_get_unread_count({
      user_id,
      chat_group_ids
    });

    return NextResponse.json({
      success: true,
      user_id,
      unread_counts,
      total_groups: unread_counts.length,
      total_unread: unread_counts.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    const error_message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[hazo_chat/unread_count] Error:', error_message, error);

    return NextResponse.json(
      {
        success: false,
        error: error_message,
        unread_counts: []
      },
      { status: 500 }
    );
  }
}
```

**What this endpoint does (v3.0):**
- Takes `user_id` as a required query parameter
- Takes optional `chat_group_ids` as a comma-separated list to filter specific groups
- Returns an array of objects with `chat_group_id` and `count` of unread messages
- Only counts messages in groups where the user is a member
- Excludes messages sent by the user themselves
- Only counts messages where `read_at` is `null` and `deleted_at` is `null`
- Groups results by `chat_group_id`
- Sorts by count (descending - most unread first)

**Response format:**
```json
{
  "success": true,
  "user_id": "user-123",
  "unread_counts": [
    { "chat_group_id": "group-1", "count": 5 },
    { "chat_group_id": "group-2", "count": 3 }
  ],
  "total_groups": 2,
  "total_unread": 8
}
```

**Note:** This endpoint is optional. Only create it if you need to display unread message counts in your UI.

### API Routes Summary

| Endpoint | Method | File | Purpose |
|----------|--------|------|---------|
| `/api/hazo_chat/messages` | GET, POST | `api/hazo_chat/messages/route.ts` | Message CRUD |
| `/api/hazo_chat/messages/[id]/read` | PATCH | `api/hazo_chat/messages/[id]/read/route.ts` | Mark message as read (automatic) |
| `/api/hazo_chat/unread_count` | GET | `api/hazo_chat/unread_count/route.ts` | Get unread counts (optional) |
| `/api/hazo_auth/me` | GET | `api/hazo_auth/me/route.ts` | Get current user |
| `/api/hazo_auth/profiles` | POST | `api/hazo_auth/profiles/route.ts` | Get user profiles |

### Verification
- [ ] All API route files exist
- [ ] `GET /api/hazo_auth/me` returns user data when logged in
- [ ] `POST /api/hazo_auth/profiles` returns profiles for given IDs
- [ ] `GET /api/hazo_chat/messages?chat_group_id=xxx` works (v3.0)
- [ ] `PATCH /api/hazo_chat/messages/[message-id]/read` marks message as read
- [ ] `GET /api/hazo_chat/unread_count?user_id=xxx` returns unread counts (v3.0, if implemented)

---

## 5. Component Integration

### Step 5.1: Basic Usage

**File: `src/app/chat/page.tsx`**

```typescript
'use client';

import { HazoChat } from 'hazo_chat';

export default function ChatPage() {
  return (
    <div className="h-screen">
      <HazoChat
        chat_group_id="group-uuid-here"
        title="Chat"
        subtitle="Direct Message"
      />
    </div>
  );
}
```

### Step 5.2: With All Options

```typescript
'use client';

import { HazoChat } from 'hazo_chat';

export default function ChatPage() {
  return (
    <HazoChat
      chat_group_id="group-123"
      reference_id="project-456"
      reference_type="project_chat"
      api_base_url="/api/hazo_chat"
      timezone="Australia/Sydney"
      title="Project Discussion"
      subtitle="Design Review"
      additional_references={[
        {
          id: 'doc-1',
          type: 'document',
          scope: 'field',
          name: 'Design.pdf',
          url: '/files/design.pdf'
        }
      ]}
      on_close={() => window.history.back()}
      className="h-[600px]"
    />
  );
}
```

### Step 5.3: Container Requirements

**Critical:** The `HazoChat` component requires specific container dimensions to render correctly.

#### Container Height Requirement

The component uses `h-full`, which requires its parent container to have a **defined height**. Without this, the chat message area may collapse.

**Required:** Parent container must have a fixed height:

```typescript
<div className="h-[600px]">  {/* ✅ Required: parent must have height */}
  <HazoChat chat_group_id={...} />
</div>

// OR

<div className="h-screen">  {/* ✅ Full screen height */}
  <HazoChat chat_group_id={...} />
</div>

// ❌ WRONG - will cause layout issues
<div>  {/* No height defined */}
  <HazoChat chat_group_id={...} />
</div>
```

#### Container Width Requirements

- **Recommended minimum width:** 500px for optimal two-column layout (document viewer + chat messages).
- **For narrow containers (< 500px):** Document references will automatically open in a new tab when clicked instead of showing in the preview panel.
- **Document viewer defaults to collapsed** to maximize chat space. Users can expand it using the toggle button.

```typescript
// ✅ Recommended: at least 500px width
<div className="w-[600px] h-[600px]">
  <HazoChat chat_group_id={...} />
</div>

// ✅ Narrow container: documents will open in new tab
<div className="w-[400px] h-[600px]">
  <HazoChat chat_group_id={...} />
</div>
```

#### Complete Container Example

```typescript
'use client';

import { HazoChat } from 'hazo_chat';

export default function ChatPage() {
  return (
    <div className="w-[600px] h-[600px] flex-shrink-0">
      <div className="rounded-xl border shadow-lg p-0 h-full">
        <HazoChat
          chat_group_id="group-123"
          title="Chat"
          className="h-full"
        />
      </div>
    </div>
  );
}
```

**Verification:**
- [ ] Parent container has defined height (e.g., `h-[600px]`, `h-screen`)
- [ ] Container width is at least 500px for optimal layout (or accept narrow width behavior)
- [ ] Component renders with proper chat message area visible
- [ ] Document viewer toggle button is accessible

---

## 6. UI Components and Styling Setup

### Step 6.1: Install UI Dependencies

Install the required UI packages:

```bash
npm install sonner @radix-ui/react-alert-dialog
```

**Verification:**
- [ ] `sonner` package installed
- [ ] `@radix-ui/react-alert-dialog` installed
- [ ] `package.json` contains both dependencies

### Step 6.2: Create Alert Dialog Component

**File:** `src/components/ui/alert-dialog.tsx`

Create the Alert Dialog component using shadcn/ui style. This component is used for messages requiring user acknowledgment.

**Reference Implementation:** See `test-app/src/components/ui/alert-dialog.tsx` for a complete example.

**Minimum Required Structure:**

```typescript
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

**Verification:**
- [ ] Alert Dialog component created at `src/components/ui/alert-dialog.tsx`
- [ ] Component exports all required sub-components
- [ ] No TypeScript errors

### Step 6.3: Setup Sonner Toaster

**File:** `src/app/layout.tsx`

Add the Sonner Toaster component to your root layout for toast notifications:

```tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

**Verification:**
- [ ] `Toaster` imported from `sonner`
- [ ] Toaster added to root layout
- [ ] Position set to `top-right`
- [ ] `richColors` prop enabled

### Step 6.4: Configure Tailwind CSS

**File:** `tailwind.config.ts`

Ensure hazo_chat package is included in Tailwind content paths:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Include hazo_chat package components
    './node_modules/hazo_chat/dist/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of your config
};

export default config;
```

**Important:** Without this configuration, Tailwind classes used by hazo_chat components will not be compiled, causing styling issues.

**Verification:**
- [ ] `tailwind.config.ts` includes hazo_chat package path
- [ ] Path matches your `node_modules` location
- [ ] Config syntax is valid

### Step 6.5: Setup CSS Variables

**File:** `src/app/globals.css`

Ensure all required CSS variables are defined. hazo_chat uses shadcn/ui standard CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.5rem;
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}
```

**Reference:** See `test-app/src/app/globals.css` for a complete example with oklch color format.

**Verification:**
- [ ] All required CSS variables defined in `:root`
- [ ] Dark mode variables defined (if supporting dark mode)
- [ ] Tailwind directives included (`@tailwind base`, etc.)
- [ ] Base layer styles applied

### UI Setup Verification Checklist

- [ ] All UI dependencies installed
- [ ] Alert Dialog component created and working
- [ ] Sonner Toaster added to root layout
- [ ] Tailwind config includes hazo_chat paths
- [ ] CSS variables defined in globals.css
- [ ] No build errors related to UI components
- [ ] Toast notifications working
- [ ] Alert dialogs displaying correctly

---

## 7. Configuration (Optional)

### hazo_connect Configuration

Create `hazo_connect_config.ini` in project root:

```ini
[database]
type = sqlite
sqlite_path = ./data/app.db
```

### hazo_chat Configuration

Create `hazo_chat_config.ini` in project root (optional):

```ini
[chat]
polling_interval = 5000
messages_per_page = 20

[uploads]
max_file_size_mb = 10
allowed_types = pdf,png,jpg,jpeg,gif
```

### Next.js Configuration

Update `next.config.js` if needed:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['hazo_chat', 'hazo_connect'],
  experimental: {
    serverComponentsExternalPackages: ['sql.js', 'better-sqlite3'],
  },
};

module.exports = nextConfig;
```

---

## 8. UI Design Standards Compliance

### Visual Design Verification

**Document Preview:**
- [ ] Empty state shows `IoDocumentOutline` icon (not image icon)
- [ ] Icon size is 48px × 48px with 50% opacity

**REFERENCES Section:**
- [ ] Font size is 9px (`text-[9px]`)
- [ ] Text is uppercase with wide letter spacing
- [ ] Section is collapsible with chevron indicator

**Input Area:**
- [ ] Padding is 16px (`p-4`) on all sides
- [ ] Input field and send button are properly aligned

**Message Display:**
- [ ] Only timestamp shown under messages (no status icons)
- [ ] Double green checkmark (`IoCheckmarkDoneSharp`) appears when message is read
- [ ] Checkmark only shows for sender's messages with `read_at` not null

**Header:**
- [ ] Close button visible when `on_close` prop provided
- [ ] Hamburger menu hidden on desktop (screens >= 768px)
- [ ] Hamburger menu visible on mobile (screens < 768px)

**Document Viewer:**
- [ ] Toggle button visible between viewer and chat area
- [ ] Smooth expand/collapse transitions
- [ ] Button position adjusts correctly

For detailed specifications, see the [UI Design Standards](#ui-design-standards) section in README.md.

---

## 9. Verification Checklist

### Installation Verification
- [ ] All packages installed without errors
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors

### Database Verification

**PostgreSQL:**
- [ ] UUID extension enabled (check with: `SELECT * FROM pg_extension WHERE extname = 'uuid-ossp' OR extname = 'pgcrypto';`)
- [ ] Enum type created (if using): `SELECT typname FROM pg_type WHERE typname = 'hazo_chat_reference_type';`
- [ ] `hazo_users` table exists
- [ ] `hazo_chat_group` table exists (v3.0)
- [ ] `hazo_chat_group_users` table exists (v3.0)
- [ ] `hazo_chat` table exists with `chat_group_id` column (v3.0)
- [ ] All indexes created (check with: `SELECT indexname FROM pg_indexes WHERE tablename = 'hazo_chat';`)
- [ ] UUID default generation works: Test insert without providing ID
- [ ] Timestamp defaults work: Test insert without providing timestamps
- [ ] Boolean columns accept TRUE/FALSE values
- [ ] Can insert and query messages
- [ ] Foreign key constraints work (if enabled)

**SQLite:**
- [ ] `hazo_users` table exists
- [ ] `hazo_chat_group` table exists (v3.0)
- [ ] `hazo_chat_group_users` table exists (v3.0)
- [ ] `hazo_chat` table exists with `chat_group_id` column (v3.0)
- [ ] At least one user exists in database
- [ ] At least one chat group exists with memberships
- [ ] Can insert and query messages

### API Verification

Test with curl:

```bash
# Test auth endpoint (should return user data if logged in)
curl http://localhost:3000/api/hazo_auth/me

# Test profiles endpoint
curl -X POST http://localhost:3000/api/hazo_auth/profiles \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["user-id-here"]}'

# Test messages endpoint (v3.0 - uses chat_group_id)
curl "http://localhost:3000/api/hazo_chat/messages?chat_group_id=group-id"

# Test unread count endpoint (v3.0 - uses user_id, if implemented)
curl "http://localhost:3000/api/hazo_chat/unread_count?user_id=user-id"
```

### UI Verification & Responsive Behavior

#### Hamburger Menu Button

**Expected Behavior:**
- [ ] **Desktop (> 768px)**: Hamburger button should be **hidden**
  - Document viewer is always visible as a left column
  - Use the chevron toggle button to expand/collapse the document viewer
- [ ] **Mobile (< 768px)**: Hamburger button should be **visible** in the header
  - Click to toggle document viewer sidebar overlay
  - Sidebar slides in from the left on mobile

**If hamburger appears on desktop, check:**
1. [ ] TailwindCSS is properly installed: `npm install tailwindcss`
2. [ ] Tailwind config includes responsive breakpoints (should be default)
3. [ ] Verify `md:` prefix classes are being compiled correctly
4. [ ] Check browser DevTools - button should have `display: none` at `md:` breakpoint
5. [ ] Ensure CSS is not being overridden by custom styles

#### Document Viewer Toggle Button

**Expected Behavior:**
- [ ] Chevron toggle button appears between document viewer and chat area
- [ ] Click to expand/collapse document viewer column
- [ ] Button position adjusts when viewer is expanded/collapsed
- [ ] Smooth transition animation when toggling

#### Chat Input Area

**Expected Behavior:**
- [ ] File attachment and image buttons are aligned with text input
- [ ] All buttons have consistent size (`40px` height)
- [ ] Send button aligns properly with textarea
- [ ] No visual misalignment or spacing issues

### UI Verification
- [ ] Chat component renders without errors
- [ ] No "Module not found: Can't resolve 'fs'" errors
- [ ] Messages load and display correctly
- [ ] Can send new messages
- [ ] Messages appear in real-time (within polling interval)

---

## 10. Troubleshooting

### Error: "Module not found: Can't resolve 'fs'"

**Cause:** Server-side code imported in client component.

**Solution:** This shouldn't happen with v2.0. Ensure:
1. You're using `hazo_chat` version 2.0+
2. You're not importing from `hazo_connect/server` in client components
3. API routes use server-side imports only

### Error: "401 Unauthorized"

**Cause:** User not authenticated.

**Solution:**
1. Check `/api/hazo_auth/me` returns authenticated user
2. Ensure `hazo_auth_user_id` cookie is set
3. Check cookie settings (httpOnly, sameSite, secure)

### Error: "Messages not loading"

**Checklist:**
1. Is user authenticated? Check `/api/hazo_auth/me`
2. Is `chat_group_id` provided? (v3.0)
3. Is user a member of the chat group?
4. Check browser console for errors
5. Check network tab for API responses
6. Check server logs for API errors

### Issue: Hamburger button visible on desktop

**Cause:** TailwindCSS responsive classes not being applied correctly.

**Solution:**
1. Verify TailwindCSS is installed: `npm list tailwindcss`
2. Check `tailwind.config.js` includes responsive breakpoints:
   ```js
   module.exports = {
     content: [
       "./node_modules/hazo_chat/**/*.{js,ts,jsx,tsx}",
       // ... your content paths
     ],
     theme: {
       extend: {},
     },
   }
   ```
3. Ensure CSS file imports Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
4. Check browser DevTools - hamburger button should have `display: none` on desktop
5. Verify no custom CSS is overriding the `md:hidden` class
6. Clear build cache: `rm -rf .next` and rebuild

**Expected Behavior:**
- Desktop: Hamburger button is hidden, document viewer always visible
- Mobile: Hamburger button visible to toggle sidebar overlay

### Error: "Profiles not loading"

**Cause:** `/api/hazo_auth/profiles` not returning data.

**Solution:**
1. Check the API route exists
2. Verify users exist in database
3. Check API response format matches expected

### Error: "Polling not working"

**Checklist:**
1. Check network tab for `/api/hazo_chat/messages` requests
2. Verify polling interval (default: 5000ms)
3. Check for JavaScript errors in console
4. Verify API returns `{ success: true, messages: [] }` format

### Issue: UI components not styled correctly

**Possible Causes:**
1. Tailwind CSS not configured to include hazo_chat package paths
2. CSS variables not defined in globals.css
3. Missing UI dependencies

**Solution:**
1. Ensure `tailwind.config.ts` includes: `'./node_modules/hazo_chat/dist/**/*.{js,ts,jsx,tsx}'` in content array
2. Verify all required CSS variables are defined (see Step 6.5)
3. Check that `@tailwind base`, `@tailwind components`, `@tailwind utilities` are in globals.css
4. Rebuild: `rm -rf .next` and `npm run build`

### Issue: Alert Dialog not working

**Cause:** Alert Dialog component not created or not properly imported.

**Solution:**
1. Create Alert Dialog component at `src/components/ui/alert-dialog.tsx`
2. See `test-app/src/components/ui/alert-dialog.tsx` for reference
3. Ensure `@radix-ui/react-alert-dialog` is installed
4. Verify component exports all required sub-components

### Issue: Toast notifications not appearing

**Cause:** Sonner Toaster not added to root layout.

**Solution:**
1. Import `Toaster` from `sonner` in root layout
2. Add `<Toaster position="top-right" richColors />` to layout body
3. Ensure `sonner` package is installed
4. Check browser console for errors

### Issue: CSS variables not applying

**Cause:** CSS variables not defined or Tailwind not processing them.

**Solution:**
1. Verify CSS variables are in `globals.css` under `@layer base { :root { ... } }`
2. Check that Tailwind config has correct content paths
3. Ensure CSS file is imported in root layout
4. Rebuild CSS: restart dev server or rebuild

---

## Migration from v2.x to v3.0

This section provides instructions for upgrading from hazo_chat v2.x (1-to-1 chat with `receiver_user_id`) to v3.0 (group-based chat with `chat_group_id`).

### Breaking Changes

1. **Database Schema:**
   - `hazo_chat.receiver_user_id` column replaced with `chat_group_id`
   - New tables: `hazo_chat_group` and `hazo_chat_group_users`

2. **Component Props:**
   - `receiver_user_id` prop replaced with `chat_group_id`

3. **API Endpoints:**
   - GET/POST `/api/hazo_chat/messages` now uses `chat_group_id` query param
   - GET `/api/hazo_chat/unread_count` now uses `user_id` param instead of `receiver_user_id`

4. **Types:**
   - `ChatMessage.receiver_profile` removed
   - `CreateMessagePayload.receiver_user_id` replaced with `chat_group_id`

### Migration Steps (PostgreSQL)

```sql
-- Step 1: Create new tables
CREATE TABLE IF NOT EXISTS hazo_chat_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES hazo_users(id),
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hazo_chat_group_users (
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES hazo_users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_group_id, user_id)
);

-- Step 2: Create groups for existing 1-to-1 conversations
-- This example creates one group per unique receiver_user_id
INSERT INTO hazo_chat_group (id, client_user_id, name, created_at, changed_at)
SELECT DISTINCT
  gen_random_uuid(),
  receiver_user_id,
  'Migrated Chat',
  NOW(),
  NOW()
FROM hazo_chat
WHERE receiver_user_id IS NOT NULL;

-- Step 3: Add sender as staff member to each group
INSERT INTO hazo_chat_group_users (chat_group_id, user_id, role, created_at, changed_at)
SELECT DISTINCT
  g.id,
  c.sender_user_id,
  'staff',
  NOW(),
  NOW()
FROM hazo_chat c
JOIN hazo_chat_group g ON g.client_user_id = c.receiver_user_id
WHERE c.sender_user_id != c.receiver_user_id
ON CONFLICT (chat_group_id, user_id) DO NOTHING;

-- Step 4: Add client as client member to each group
INSERT INTO hazo_chat_group_users (chat_group_id, user_id, role, created_at, changed_at)
SELECT
  id,
  client_user_id,
  'client',
  NOW(),
  NOW()
FROM hazo_chat_group
ON CONFLICT (chat_group_id, user_id) DO NOTHING;

-- Step 5: Add chat_group_id column to hazo_chat
ALTER TABLE hazo_chat ADD COLUMN chat_group_id UUID;

-- Step 6: Populate chat_group_id from receiver_user_id
UPDATE hazo_chat c
SET chat_group_id = g.id
FROM hazo_chat_group g
WHERE g.client_user_id = c.receiver_user_id;

-- Step 7: Make chat_group_id NOT NULL and add foreign key
ALTER TABLE hazo_chat
  ALTER COLUMN chat_group_id SET NOT NULL,
  ADD CONSTRAINT fk_hazo_chat_group
    FOREIGN KEY (chat_group_id)
    REFERENCES hazo_chat_group(id);

-- Step 8: Drop old column and index
DROP INDEX IF EXISTS idx_hazo_chat_receiver;
ALTER TABLE hazo_chat DROP COLUMN receiver_user_id;

-- Step 9: Create new index
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group ON hazo_chat(chat_group_id);
```

### Migration Steps (SQLite)

```sql
-- Step 1: Create new tables
CREATE TABLE IF NOT EXISTS hazo_chat_group (
  id TEXT PRIMARY KEY,
  client_user_id TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_user_id) REFERENCES hazo_users(id)
);

CREATE TABLE IF NOT EXISTS hazo_chat_group_users (
  chat_group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (chat_group_id, user_id),
  FOREIGN KEY (chat_group_id) REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES hazo_users(id) ON DELETE CASCADE
);

-- Step 2: Create groups for existing conversations (manually generate UUIDs)
-- Note: SQLite doesn't have gen_random_uuid(), use your app or external tool

-- Step 3: Recreate hazo_chat table with new schema (SQLite doesn't support ALTER COLUMN)
ALTER TABLE hazo_chat RENAME TO hazo_chat_old;

CREATE TABLE hazo_chat (
  id TEXT PRIMARY KEY,
  reference_id TEXT NOT NULL,
  reference_type TEXT DEFAULT 'chat',
  sender_user_id TEXT NOT NULL,
  chat_group_id TEXT NOT NULL,
  message_text TEXT,
  reference_list TEXT,
  read_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sender_user_id) REFERENCES hazo_users(id),
  FOREIGN KEY (chat_group_id) REFERENCES hazo_chat_group(id)
);

-- Step 4: Migrate data (you'll need to map receiver_user_id to chat_group_id)
INSERT INTO hazo_chat (id, reference_id, reference_type, sender_user_id, chat_group_id,
                       message_text, reference_list, read_at, deleted_at, created_at, changed_at)
SELECT o.id, o.reference_id, o.reference_type, o.sender_user_id, g.id,
       o.message_text, o.reference_list, o.read_at, o.deleted_at, o.created_at, o.changed_at
FROM hazo_chat_old o
JOIN hazo_chat_group g ON g.client_user_id = o.receiver_user_id;

-- Step 5: Drop old table
DROP TABLE hazo_chat_old;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_id ON hazo_chat(reference_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_sender ON hazo_chat(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group ON hazo_chat(chat_group_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_created ON hazo_chat(created_at DESC);
```

### Code Changes Required

1. **Update HazoChat component usage:**
   ```typescript
   // Before (v2.x)
   <HazoChat receiver_user_id="user-123" />

   // After (v3.0)
   <HazoChat chat_group_id="group-123" />
   ```

2. **Update API route for unread count:**
   ```typescript
   // Before (v2.x)
   const unread = await hazo_chat_get_unread_count(receiver_user_id);

   // After (v3.0)
   const unread = await hazo_chat_get_unread_count({ user_id, chat_group_ids });
   ```

3. **Update any direct database queries** to use `chat_group_id` instead of `receiver_user_id`.

---

## Migration from v3.0 to v3.1 (Generic Schema)

This section provides instructions for upgrading from hazo_chat v3.0 to v3.1 to support flexible chat patterns (support, peer, and group conversations).

### What Changed in v3.1

1. **`client_user_id`**: Now nullable (optional) for peer/group chats
2. **`group_type`**: New field to identify conversation type ('support', 'peer', 'group')
3. **Expanded roles**: 'owner', 'admin', 'member' added alongside 'client' and 'staff'

### PostgreSQL Migration

```sql
-- Step 1: Create enum types (if not already created)
CREATE TYPE hazo_enum_group_type AS ENUM ('support', 'peer', 'group');
CREATE TYPE hazo_enum_group_role AS ENUM ('client', 'staff', 'owner', 'admin', 'member');

-- Step 2: Add group_type column with default 'support' for existing groups
ALTER TABLE hazo_chat_group
  ADD COLUMN group_type hazo_enum_group_type DEFAULT 'support';

-- Step 3: Make client_user_id nullable
ALTER TABLE hazo_chat_group
  ALTER COLUMN client_user_id DROP NOT NULL;

-- Step 4: Update role column to use enum type (if using enum approach)
-- Option A: Convert to enum type (recommended)
ALTER TABLE hazo_chat_group_users
  DROP CONSTRAINT IF EXISTS hazo_chat_group_users_role_check;

ALTER TABLE hazo_chat_group_users
  ALTER COLUMN role TYPE hazo_enum_group_role
  USING role::hazo_enum_group_role;

-- Option B: Keep VARCHAR with expanded CHECK constraint
-- ALTER TABLE hazo_chat_group_users
--   DROP CONSTRAINT IF EXISTS hazo_chat_group_users_role_check;
--
-- ALTER TABLE hazo_chat_group_users
--   ADD CONSTRAINT hazo_chat_group_users_role_check
--   CHECK (role IN ('client', 'staff', 'owner', 'admin', 'member'));

-- Step 5: Create index for group_type
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_type ON hazo_chat_group(group_type);
```

### SQLite Migration

SQLite doesn't support ALTER COLUMN, so table recreation is needed:

```sql
-- Step 1: Rename existing tables
ALTER TABLE hazo_chat_group RENAME TO hazo_chat_group_old;
ALTER TABLE hazo_chat_group_users RENAME TO hazo_chat_group_users_old;

-- Step 2: Create new hazo_chat_group table with updated schema
CREATE TABLE hazo_chat_group (
  id TEXT PRIMARY KEY,
  client_user_id TEXT,  -- Now nullable
  group_type TEXT DEFAULT 'support' CHECK (group_type IN ('support', 'peer', 'group')),
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_user_id) REFERENCES hazo_users(id)
);

-- Step 3: Migrate group data (existing groups become 'support' type)
INSERT INTO hazo_chat_group (id, client_user_id, group_type, name, created_at, changed_at)
SELECT id, client_user_id, 'support', name, created_at, changed_at
FROM hazo_chat_group_old;

-- Step 4: Drop old group table
DROP TABLE hazo_chat_group_old;

-- Step 5: Create new hazo_chat_group_users table with expanded roles
CREATE TABLE hazo_chat_group_users (
  chat_group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff', 'owner', 'admin', 'member')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (chat_group_id, user_id),
  FOREIGN KEY (chat_group_id) REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES hazo_users(id) ON DELETE CASCADE
);

-- Step 6: Migrate membership data
INSERT INTO hazo_chat_group_users SELECT * FROM hazo_chat_group_users_old;

-- Step 7: Drop old membership table
DROP TABLE hazo_chat_group_users_old;

-- Step 8: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_client ON hazo_chat_group(client_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_type ON hazo_chat_group(group_type);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_users_user ON hazo_chat_group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_group_users_group ON hazo_chat_group_users(chat_group_id);
```

### No Code Changes Required

The TypeScript types have been updated, but the API handlers do not enforce role-based permissions. Existing code will continue to work without modification.

---

## Quick Setup Summary

```bash
# 1. Install packages
npm install hazo_chat hazo_connect

# 2. Create API routes
mkdir -p src/app/api/hazo_chat/messages
mkdir -p src/app/api/hazo_chat/unread_count  # Optional: for unread counts
mkdir -p src/app/api/hazo_auth/me
mkdir -p src/app/api/hazo_auth/profiles

# 3. Create database table (run SQL)

# 4. Start development server
npm run dev

# 5. Test API endpoints

# 6. Use HazoChat component
```

---

For more information, see the [README.md](./README.md) and [test-app](./test-app) for complete working examples.
