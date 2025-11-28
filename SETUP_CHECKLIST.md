# hazo_chat Setup Checklist (v2.0)

A comprehensive, step-by-step guide for setting up hazo_chat in a Next.js project. This checklist is designed for both AI assistants and human developers.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Package Installation](#2-package-installation)
3. [Database Setup](#3-database-setup)
4. [API Routes](#4-api-routes)
5. [Component Integration](#5-component-integration)
6. [Configuration (Optional)](#6-configuration-optional)
7. [Verification Checklist](#7-verification-checklist)
8. [Troubleshooting](#8-troubleshooting)

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

### Step 3.1: Create hazo_chat Table

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

### Step 3.2: Ensure Users Table Exists

You need a users table with at least these fields:

```sql
CREATE TABLE IF NOT EXISTS hazo_users (
  id TEXT PRIMARY KEY,
  email_address TEXT UNIQUE NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
```

### Verification
- [ ] `hazo_chat` table exists in database
- [ ] Users table exists with at least one user
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

### API Routes Summary

| Endpoint | Method | File | Purpose |
|----------|--------|------|---------|
| `/api/hazo_chat/messages` | GET, POST | `api/hazo_chat/messages/route.ts` | Message CRUD |
| `/api/hazo_auth/me` | GET | `api/hazo_auth/me/route.ts` | Get current user |
| `/api/hazo_auth/profiles` | POST | `api/hazo_auth/profiles/route.ts` | Get user profiles |

### Verification
- [ ] All API route files exist
- [ ] `GET /api/hazo_auth/me` returns user data when logged in
- [ ] `POST /api/hazo_auth/profiles` returns profiles for given IDs
- [ ] `GET /api/hazo_chat/messages?receiver_user_id=xxx` works

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
        receiver_user_id="recipient-uuid-here"
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
      receiver_user_id="user-123"
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

---

## 6. Configuration (Optional)

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

## 7. Verification Checklist

### Installation Verification
- [ ] All packages installed without errors
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors

### Database Verification
- [ ] `hazo_chat` table exists
- [ ] Users table exists with test users
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

# Test messages endpoint
curl "http://localhost:3000/api/hazo_chat/messages?receiver_user_id=user-id"
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

## 8. Troubleshooting

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
2. Is `receiver_user_id` provided?
3. Check browser console for errors
4. Check network tab for API responses
5. Check server logs for API errors

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

---

## Quick Setup Summary

```bash
# 1. Install packages
npm install hazo_chat hazo_connect

# 2. Create API routes
mkdir -p src/app/api/hazo_chat/messages
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
