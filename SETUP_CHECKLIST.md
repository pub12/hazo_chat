# hazo_chat Setup Checklist

A comprehensive, step-by-step guide for setting up hazo_chat in a Next.js project. This checklist is designed for both AI assistants and human developers.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Package Installation](#2-package-installation)
3. [Configuration Files](#3-configuration-files)
4. [Database Setup](#4-database-setup)
5. [Environment Variables](#5-environment-variables)
6. [Next.js Configuration](#6-nextjs-configuration)
7. [API Routes](#7-api-routes)
8. [Page Routes (Optional)](#8-page-routes-optional)
9. [Component Integration](#9-component-integration)
10. [Verification Checklist](#10-verification-checklist)
11. [Troubleshooting](#11-troubleshooting)

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
npm install hazo_chat hazo_connect hazo_auth hazo_config
```

### Step 2.2: Install Peer Dependencies (if not already installed)

```bash
npm install react react-dom
```

### Step 2.3: Install Additional Dependencies

```bash
# For UUID generation (optional, if not using hazo_auth's ID generation)
npm install uuid
npm install -D @types/uuid
```

### Verification
- [ ] `package.json` contains `hazo_chat`, `hazo_connect`, `hazo_auth`
- [ ] No npm installation errors
- [ ] `node_modules/hazo_chat` exists

---

## 3. Configuration Files

### Step 3.1: Create hazo_connect_config.ini

Create in project root: `hazo_connect_config.ini`

```ini
[database]
; Database type: sqlite, postgrest, supabase
type = sqlite

; For SQLite - path relative to project root
sqlite_path = ./data/app.db

; For PostgreSQL/Supabase (uncomment if using)
; postgrest_url = http://localhost:3000
; supabase_url = https://your-project.supabase.co
; supabase_anon_key = your-anon-key
```

### Step 3.2: Create hazo_auth_config.ini

Create in project root: `hazo_auth_config.ini`

```ini
[auth]
; JWT secret for token signing
jwt_secret = your-secure-secret-key-here
jwt_expiry = 7d

; Cookie settings
cookie_name = hazo_auth_token
cookie_secure = false
cookie_http_only = true
cookie_same_site = lax

[login]
enable_remember_me = true
max_login_attempts = 5
lockout_duration = 300

[registration]
enable_registration = true
require_email_verification = false
default_role = user

[ui]
; Visual panel image for auth pages
visual_panel_image = /globe.svg
```

### Step 3.3: Create hazo_chat_config.ini (Optional)

Create in project root: `hazo_chat_config.ini`

```ini
[chat]
; Polling interval in milliseconds (default: 5000)
polling_interval = 5000

; Messages to load per page (default: 20)
messages_per_page = 20

[uploads]
; Maximum file size in MB (default: 10)
max_file_size_mb = 10

; Allowed file extensions
allowed_types = pdf,png,jpg,jpeg,gif,txt,doc,docx
```

### Verification
- [ ] `hazo_connect_config.ini` exists in project root
- [ ] `hazo_auth_config.ini` exists in project root
- [ ] Database path directory exists (create `./data/` if using SQLite)

---

## 4. Database Setup

### Step 4.1: Create hazo_chat Table

Run this SQL to create the chat messages table:

```sql
-- hazo_chat table for storing chat messages
CREATE TABLE IF NOT EXISTS hazo_chat (
  id TEXT PRIMARY KEY,
  reference_id TEXT NOT NULL,
  reference_type TEXT DEFAULT 'chat',
  sender_user_id TEXT NOT NULL,
  receiver_user_id TEXT NOT NULL,
  message_text TEXT,
  reference_list TEXT,
  read_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  changed_at TEXT NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hazo_chat_reference_id ON hazo_chat(reference_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_sender ON hazo_chat(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_receiver ON hazo_chat(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_hazo_chat_created ON hazo_chat(created_at DESC);
```

### Step 4.2: Ensure hazo_users Table Exists

hazo_auth should have created this, but verify:

```sql
-- hazo_users table (created by hazo_auth)
CREATE TABLE IF NOT EXISTS hazo_users (
  id TEXT PRIMARY KEY,
  email_address TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  profile_source TEXT DEFAULT 'default',
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
```

### Verification
- [ ] `hazo_chat` table exists in database
- [ ] `hazo_users` table exists with at least one user
- [ ] Can query: `SELECT * FROM hazo_chat LIMIT 1`

---

## 5. Environment Variables

### Step 5.1: Create .env.local

```env
# Database (if not using config.ini)
HAZO_CONNECT_TYPE=sqlite
HAZO_CONNECT_SQLITE_PATH=./data/app.db

# Auth secrets
HAZO_AUTH_JWT_SECRET=your-secure-secret-key-min-32-chars

# Optional: Supabase/PostgreSQL
# HAZO_CONNECT_POSTGREST_URL=http://localhost:3000
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
```

### Step 5.2: Add to .gitignore

```gitignore
# Environment files
.env
.env.local
.env.*.local

# Database files (if using SQLite)
*.db
*.sqlite
data/
```

### Verification
- [ ] `.env.local` exists
- [ ] `.env.local` is in `.gitignore`
- [ ] Secrets are not committed to git

---

## 6. Next.js Configuration

### Step 6.1: Update next.config.js

```javascript
/**
 * Next.js Configuration with hazo_chat support
 */

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the hazo packages for ES module support
  transpilePackages: ['hazo_chat', 'hazo_connect', 'hazo_auth'],

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Configure module resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };
    
    // Enable package exports resolution
    config.resolve.conditionNames = ['import', 'require', 'default'];

    // Server-side externals
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("sql.js");
        config.externals.push("hazo_notify");
      }
    }

    // WebAssembly support for sql.js
    config.experiments = {
      ...(config.experiments ?? {}),
      asyncWebAssembly: true,
    };

    return config;
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: [
      "sql.js",
      "better-sqlite3",
      "hazo_notify",
    ],
  },
};

module.exports = nextConfig;
```

### Verification
- [ ] `next.config.js` includes transpilePackages
- [ ] Server externals configured for sql.js
- [ ] No build errors with `npm run build`

---

## 7. API Routes

Create the following API routes in `src/app/api/`:

### Step 7.1: Chat Messages API

**File: `src/app/api/hazo_chat/messages/route.ts`**

```typescript
/**
 * API route for chat message operations
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCrudService } from "hazo_connect/server";
import { getHazoConnectSingleton } from "hazo_connect/nextjs/setup";
import { v4 as uuid_v4 } from "uuid";

interface ChatMessageDB {
  id: string;
  reference_id: string;
  reference_type: string;
  sender_user_id: string;
  receiver_user_id: string;
  message_text: string | null;
  reference_list: string | null;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
  changed_at: string;
  [key: string]: unknown;
}

// GET - Fetch messages
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const current_user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!current_user_id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const receiver_user_id = searchParams.get("receiver_user_id");
    const reference_id = searchParams.get("reference_id");
    const reference_type = searchParams.get("reference_type");

    if (!receiver_user_id) {
      return NextResponse.json(
        { success: false, error: "receiver_user_id is required" },
        { status: 400 }
      );
    }

    const hazoConnect = getHazoConnectSingleton();
    const chatService = createCrudService<ChatMessageDB>(hazoConnect, "hazo_chat");

    const messages = await chatService.list((query) => {
      let filteredQuery = query.whereOr([
        { field: "sender_user_id", operator: "eq", value: current_user_id },
        { field: "receiver_user_id", operator: "eq", value: current_user_id },
      ]);

      if (reference_id) {
        filteredQuery = filteredQuery.where("reference_id", "eq", reference_id);
      }
      if (reference_type) {
        filteredQuery = filteredQuery.where("reference_type", "eq", reference_type);
      }

      return filteredQuery.order("created_at", "asc");
    });

    return NextResponse.json({
      success: true,
      messages: messages || [],
      current_user_id,
    });
  } catch (error) {
    console.error("[hazo_chat/messages GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Create message
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sender_user_id = cookieStore.get("hazo_auth_user_id")?.value;

    if (!sender_user_id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiver_user_id, message_text, reference_id, reference_type, reference_list } = body;

    if (!receiver_user_id || !message_text?.trim()) {
      return NextResponse.json(
        { success: false, error: "receiver_user_id and message_text are required" },
        { status: 400 }
      );
    }

    const hazoConnect = getHazoConnectSingleton();
    const chatService = createCrudService<ChatMessageDB>(hazoConnect, "hazo_chat");

    const message_id = uuid_v4();
    const now = new Date().toISOString();

    const message_record: ChatMessageDB = {
      id: message_id,
      reference_id: reference_id || message_id,
      reference_type: reference_type || "chat",
      sender_user_id,
      receiver_user_id,
      message_text: message_text.trim(),
      reference_list: reference_list ? JSON.stringify(reference_list) : null,
      read_at: null,
      deleted_at: null,
      created_at: now,
      changed_at: now,
    };

    await chatService.insert(message_record);

    return NextResponse.json({
      success: true,
      message: message_record,
    });
  } catch (error) {
    console.error("[hazo_chat/messages POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
```

### Step 7.2: Auth Me API

**File: `src/app/api/hazo_auth/me/route.ts`**

```typescript
/**
 * API route to get current authenticated user
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { hazo_get_auth } from "hazo_auth/lib/auth/hazo_get_auth.server";

export async function GET(request: NextRequest) {
  try {
    const auth_result = await hazo_get_auth(request);

    if (!auth_result.is_authenticated || !auth_result.user) {
      return NextResponse.json({
        is_authenticated: false,
        user_id: null,
        email: null,
      });
    }

    return NextResponse.json({
      is_authenticated: true,
      user_id: auth_result.user.id,
      email: auth_result.user.email_address,
      name: auth_result.user.name,
      profile_picture_url: auth_result.user.profile_picture_url,
    });
  } catch (error) {
    console.error("[hazo_auth/me] Error:", error);
    return NextResponse.json({
      is_authenticated: false,
      user_id: null,
      email: null,
    });
  }
}
```

### Step 7.3: User Profiles API

**File: `src/app/api/hazo_auth/profiles/route.ts`**

```typescript
/**
 * API route to fetch user profiles by IDs
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createCrudService } from "hazo_connect/server";
import { getHazoConnectSingleton } from "hazo_connect/nextjs/setup";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_ids } = body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "user_ids array is required" },
        { status: 400 }
      );
    }

    const hazoConnect = getHazoConnectSingleton();
    const usersService = createCrudService(hazoConnect, "hazo_users");

    const users = await usersService.list((query) =>
      query.whereIn("id", user_ids)
    );

    const profiles: UserProfile[] = users.map((user) => ({
      id: user.id as string,
      name: (user.name as string) || (user.email_address as string).split("@")[0],
      email: user.email_address as string,
      avatar_url: user.profile_picture_url as string | undefined,
    }));

    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error("[hazo_auth/profiles] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
```

### Step 7.4: Additional Auth API Routes (Required for full hazo_auth)

Create these additional routes if using hazo_auth authentication pages:

| Route | File Path | Purpose |
|-------|-----------|---------|
| Login | `api/hazo_auth/login/route.ts` | User login |
| Logout | `api/hazo_auth/logout/route.ts` | User logout |
| Register | `api/hazo_auth/register/route.ts` | User registration |
| Users List | `api/hazo_auth/users/route.ts` | List all users |

See the test-app in this repository for complete implementations.

### Verification Checklist
- [ ] `api/hazo_chat/messages/route.ts` exists
- [ ] `api/hazo_auth/me/route.ts` exists
- [ ] `api/hazo_auth/profiles/route.ts` exists
- [ ] API routes return 200 when tested with curl

---

## 8. Page Routes (Optional)

If using hazo_auth authentication pages, create these routes:

### Authentication Pages

| Page | File Path | Purpose |
|------|-----------|---------|
| Login | `app/hazo_auth/login/page.tsx` | Login page |
| Register | `app/hazo_auth/register/page.tsx` | Registration page |
| Forgot Password | `app/hazo_auth/forgot_password/page.tsx` | Password reset request |
| Reset Password | `app/hazo_auth/reset_password/page.tsx` | Password reset form |
| Verify Email | `app/hazo_auth/verify_email/page.tsx` | Email verification |
| My Settings | `app/hazo_auth/my_settings/page.tsx` | User settings |

See the test-app for complete page implementations.

---

## 9. Component Integration

### Step 9.1: Create hazo_auth Service Wrapper

**File: `src/lib/hazo_auth_client.ts`**

```typescript
/**
 * Client-side hazo_auth service wrapper
 */

import type { HazoAuthInstance, HazoUserProfile } from 'hazo_chat';

export const hazo_auth_client: HazoAuthInstance = {
  hazo_get_auth: async () => {
    try {
      const response = await fetch('/api/hazo_auth/me');
      const data = await response.json();
      
      if (data.is_authenticated) {
        return {
          id: data.user_id,
          email: data.email,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get auth:', error);
      return null;
    }
  },

  hazo_get_user_profiles: async (user_ids: string[]): Promise<HazoUserProfile[]> => {
    try {
      const response = await fetch('/api/hazo_auth/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids }),
      });
      const data = await response.json();
      
      if (data.success) {
        return data.profiles;
      }
      return [];
    } catch (error) {
      console.error('Failed to get profiles:', error);
      return [];
    }
  },
};
```

### Step 9.2: Integrate HazoChat Component

**File: `src/app/chat/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HazoChat } from 'hazo_chat';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
import { hazo_auth_client } from '@/lib/hazo_auth_client';

export default function ChatPage() {
  const router = useRouter();
  const [is_authenticated, set_is_authenticated] = useState(false);
  const [is_loading, set_is_loading] = useState(true);
  const [recipient_id, set_recipient_id] = useState<string>('');

  // Check authentication on mount
  useEffect(() => {
    async function check_auth() {
      const user = await hazo_auth_client.hazo_get_auth();
      if (!user) {
        router.push('/hazo_auth/login');
        return;
      }
      set_is_authenticated(true);
      set_is_loading(false);
    }
    check_auth();
  }, [router]);

  if (is_loading) {
    return <div>Loading...</div>;
  }

  if (!is_authenticated || !recipient_id) {
    return <div>Select a user to chat with</div>;
  }

  const hazo_connect = getHazoConnectSingleton();

  return (
    <div className="h-screen">
      <HazoChat
        hazo_connect={hazo_connect}
        hazo_auth={hazo_auth_client}
        receiver_user_id={recipient_id}
        document_save_location="/uploads/chat"
        reference_id={`chat-${recipient_id}`}
        reference_type="direct_message"
        title="Chat"
        on_close={() => router.back()}
      />
    </div>
  );
}
```

---

## 10. Verification Checklist

### Installation Verification
- [ ] All packages installed without errors
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors

### Configuration Verification
- [ ] `hazo_connect_config.ini` exists and is readable
- [ ] Database file/connection is accessible
- [ ] Environment variables are set

### Database Verification
- [ ] `hazo_chat` table exists
- [ ] `hazo_users` table exists with test users
- [ ] Can insert and query messages

### API Verification

Test with curl or browser:

```bash
# Test auth endpoint
curl http://localhost:3000/api/hazo_auth/me

# Test profiles endpoint (with cookie/auth)
curl -X POST http://localhost:3000/api/hazo_auth/profiles \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["user-id-here"]}'

# Test messages endpoint (with cookie/auth)
curl "http://localhost:3000/api/hazo_chat/messages?receiver_user_id=user-id"
```

Expected responses:
- [ ] `/api/hazo_auth/me` returns user data or `is_authenticated: false`
- [ ] `/api/hazo_auth/profiles` returns user profiles array
- [ ] `/api/hazo_chat/messages` returns messages array

### UI Verification
- [ ] Chat component renders without errors
- [ ] Messages load and display correctly
- [ ] Can send new messages
- [ ] Messages appear in real-time (within polling interval)
- [ ] File upload works (if configured)

---

## 11. Troubleshooting

### Error: "hazo_connect.from is not a function"

**Cause:** Using wrong adapter type or import.

**Solution:**
```typescript
// Wrong
import hazo_connect from 'hazo_connect';

// Correct
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
const hazo_connect = getHazoConnectSingleton();
```

### Error: "Module not found"

**Cause:** Package not transpiled by Next.js.

**Solution:** Add to `next.config.js`:
```javascript
transpilePackages: ['hazo_chat', 'hazo_connect', 'hazo_auth'],
```

### Error: "Hydration failed"

**Cause:** Server/client rendering mismatch.

**Solution:**
```typescript
const [mounted, set_mounted] = useState(false);
useEffect(() => set_mounted(true), []);
if (!mounted) return null;
```

### Error: "Database not found"

**Cause:** SQLite path incorrect or directory doesn't exist.

**Solution:**
1. Create data directory: `mkdir -p ./data`
2. Check path in `hazo_connect_config.ini`
3. Ensure path is relative to project root

### Messages Not Loading

**Checklist:**
1. Is user authenticated? Check `/api/hazo_auth/me`
2. Is `reference_id` provided to HazoChat?
3. Is database accessible?
4. Check browser console for errors
5. Check server logs for API errors

### Polling Not Working

**Checklist:**
1. Check network tab for `/api/hazo_chat/messages` requests
2. Verify `polling_interval` in config (default: 5000ms)
3. Check for JavaScript errors in console

---

## Quick Setup Summary

```bash
# 1. Install packages
npm install hazo_chat hazo_connect hazo_auth hazo_config uuid

# 2. Create config files
touch hazo_connect_config.ini hazo_auth_config.ini

# 3. Create database directory
mkdir -p ./data

# 4. Create API routes
mkdir -p src/app/api/hazo_chat/messages
mkdir -p src/app/api/hazo_auth/me
mkdir -p src/app/api/hazo_auth/profiles

# 5. Update next.config.js with transpilePackages

# 6. Run database migrations (create hazo_chat table)

# 7. Start development server
npm run dev

# 8. Test API endpoints

# 9. Integrate HazoChat component
```

---

For more information, see the [README.md](./README.md) and [test-app](./test-app) for complete working examples.

