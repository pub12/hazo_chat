# hazo_chat

A full-featured React chat component library for group-based communication with document sharing, file attachments, and real-time messaging capabilities.

**Version 4.0.8** - Fixed excessive API calls caused by polling callback instability and concurrent initial load requests.

**Version 4.0.4** - Added `read_only` prop for view-only mode (hides chat input).

**Version 4.0** - Mandatory logging integration with `hazo_logs`. See [Logging Integration](#logging-integration) section.

**Version 3.1** - Generic schema supporting multiple chat patterns: support (client-to-staff), peer (1:1), and group conversations.

**Version 3.0** - Introduced group-based chat architecture. Multiple users can participate in a single chat group, perfect for support staff rotating on client sessions.

**Version 2.0** introduced API-first architecture with no server-side dependencies in client components.

## Features

- 👥 **Group-Based Chat** - Multiple users can participate in a single chat group
- 🏗️ **Multiple Chat Patterns** - Support for support (client-to-staff), peer (1:1), and group conversations
- 🔄 **Role-Based Access** - Support for 'client', 'staff', 'owner', 'admin', and 'member' roles within groups
- 📱 **Responsive Design** - Works on desktop and mobile with adaptive layout
- 💬 **Real-time Messaging** - Polling or manual refresh modes for message updates with optimistic UI
- 📎 **File Attachments** - Support for documents and images with preview
- 📄 **Document Viewer** - Built-in PDF and image viewer with expand/collapse toggle, download, and open in new tab actions
- 👤 **User Profiles** - Avatar display and user information
- 🔄 **Infinite Scroll** - Cursor-based pagination for message history
- ✅ **Read Receipts** - Automatic mark-as-read when messages become visible using Intersection Observer
- 🗑️ **Soft Delete** - Delete messages with undo capability
- 🎨 **Customizable** - TailwindCSS-based theming
- 🚀 **API-First** - No server-side dependencies in client components

## Table of Contents

- [Installation](#installation)
- [UI Requirements](#ui-requirements)
- [Quick Start](#quick-start)
- [API Routes Setup](#api-routes-setup)
- [Props Reference](#props-reference)
- [Hooks](#hooks)
- [Types](#types)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Migration from v1.x](#migration-from-v1x)
- [Development](#development)
- [License](#license)

## Installation

```bash
npm install hazo_chat hazo_connect hazo_logs next
```

## UI Requirements

hazo_chat requires the following UI setup to match the design standards:

### Required UI Dependencies

Install these packages in your consuming project:

```bash
npm install sonner @radix-ui/react-alert-dialog
```

### Required UI Components (shadcn/ui style)

The following components must be available in your project at `@/components/ui/`:

- `AlertDialog` - For user acknowledgment dialogs (must be created by consuming project)
- `Button` - Included in hazo_chat package
- `Input` - Included in hazo_chat package
- All other components are included in hazo_chat package

**Note:** The `AlertDialog` component is not included in the hazo_chat package. You must create it using shadcn/ui Alert Dialog component. See `test-app/src/components/ui/alert-dialog.tsx` for a reference implementation.

### Required Global Providers

Add Sonner Toaster to your root layout:

```tsx
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

### Required Tailwind Configuration

Your `tailwind.config.ts` must include hazo_chat package paths in the `content` array. This ensures that Tailwind CSS scans the component library files and includes all utility classes in your final CSS bundle.

**Complete Configuration Example:**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    // Your application's content paths
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    
    // Add this line to scan the hazo_chat package
    './node_modules/hazo_chat/dist/**/*.js',
  ],
  theme: {
    extend: {
      // Required: Font family configuration for consistent typography
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      // Required: Color variables for shadcn/ui compatibility
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      // Required: Border radius configuration
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Your additional theme extensions can go here
    },
  },
  plugins: [],
};

export default config;
```

**Important Theme Extensions:**

The `hazo_chat` component relies on specific Tailwind theme extensions to ensure consistent styling:

1. **Font Families:** The `font-sans` and `font-mono` utilities must map to CSS variables for consistent typography across all consuming applications.

2. **Color Variables:** All color utilities (e.g., `bg-background`, `text-foreground`, `border-border`) must map to CSS variables defined in your `globals.css`.

3. **Border Radius:** The component uses `rounded-lg`, `rounded-md`, and `rounded-sm` which must map to your CSS `--radius` variable.

**Note:** If you're using shadcn/ui in your project, your Tailwind config likely already includes these extensions. Simply add the `hazo_chat` package path to the `content` array.

**Why This Is Required:**

The `hazo_chat` component library uses Tailwind CSS utility classes (e.g., `flex`, `h-full`, `bg-background`, `p-4`) for all styling. These classes are not compiled into CSS by default. By adding the package path to your Tailwind `content` array, Tailwind will:

1. Scan all JavaScript files in the `hazo_chat` package
2. Extract all Tailwind utility classes used in the components
3. Include them in your application's final CSS bundle
4. Ensure the component styles are correctly applied at runtime

**Important:** Without this configuration, Tailwind classes used by hazo_chat components will not be compiled, causing styling issues such as:
- Missing styles (components appear unstyled)
- Broken layouts
- Incorrect spacing and colors
- Non-functional responsive breakpoints

**Troubleshooting:**

If you're experiencing styling issues after adding the configuration:
1. Restart your development server
2. Clear your Next.js cache: `rm -rf .next`
3. Verify the path matches your `node_modules` location
4. Check that `tailwindcss` is installed: `npm list tailwindcss`

### Required CSS Variables

Your global CSS must define these CSS variables (shadcn/ui standard):

**Core Colors:**
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`

**Border and Input:**
- `--border`, `--input`, `--ring`

**Card:**
- `--card`, `--card-foreground`

See `test-app/src/app/globals.css` for complete variable definitions with example values.

### UI Design Standards

This section defines the visual design standards and component behavior specifications for hazo_chat. All consuming projects should follow these standards to ensure consistent UI appearance and behavior.

#### Visual Design Elements

**Document Preview Icon:**
- Location: Empty state in document viewer (`HazoChatDocumentViewer`)
- Icon: `IoDocumentOutline` (from `react-icons/io5`)
- Size: `w-12 h-12` (48px × 48px)
- Opacity: `opacity-50`
- Text: "Select a document to preview" in `text-sm`

**REFERENCES Section Font:**
- Location: References section header
- Font size: `text-[9px]` (9px)
- Font weight: `font-medium`
- Text transform: `uppercase`
- Letter spacing: `tracking-wider`
- Color: `text-muted-foreground`

**Input Area Padding:**
- Location: Chat input container (`HazoChatInput`)
- Padding: `p-4` (16px on all sides)
- Border: `border-t` (top border only)
- Background: `bg-background`

**Message Timestamp Display:**
- Location: Chat bubble footer (`ChatBubble`)
- Font size: `text-xs`
- Color: `text-muted-foreground`
- Time format: 24-hour format (e.g., "10:37", "15:51")
- Date prefix: Messages before today show date in `dd/MMM` format (e.g., "02/Dec 10:37")
- Timezone: Respects `timezone` prop (default: "GMT+10")

**Message Status Indicators (Sender's Messages Only):**
- Location: Chat bubble footer, after timestamp
- Position: After timestamp with `gap-1` spacing
- Size: `h-4 w-4` (16px × 16px)

**Sent Indicator (Grey Single Check):**
- Icon: `IoCheckmark` (from `react-icons/io5`)
- Color: `text-muted-foreground` (grey)
- Display condition: Shown when message is sent but `read_at` is null
- Meaning: Message delivered but not yet read by recipient

**Read Receipt (Green Double Check):**
- Icon: `IoCheckmarkDoneSharp` (from `react-icons/io5`)
- Color: `text-green-500` (green)
- Display condition: Only shown when `read_at` is not null
- Meaning: Message has been read by recipient

#### Component Behavior

**Close Button:**
- Visibility: Always visible when `on_close` prop is provided to `HazoChat` component
- Icon: `IoClose` (from `react-icons/io5`)
- Size: `h-8 w-8` (32px × 32px)
- Variant: `ghost`
- Hover state: `hover:bg-destructive/10 hover:text-destructive`
- Position: Top-right of header, after refresh button

**Hamburger Menu Button:**
- Desktop behavior: Hidden (`md:hidden` class)
- Mobile behavior: Visible on screens < 768px
- Purpose: Toggle document viewer sidebar on mobile
- Icon: `IoMenuOutline` (from `react-icons/io5`)
- Size: `h-8 w-8` (32px × 32px)
- Position: Top-left of header, before title

**Important:** If hamburger button appears on desktop, check Tailwind CSS configuration and ensure `md:` breakpoint utilities are working correctly.

**Document Viewer Toggle Button:**
- Icon: Chevron (`IoChevronBack` when expanded, `IoChevronForward` when collapsed)
- Size: `h-8 w-6` (32px height × 24px width)
- Position: Absolute, vertically centered between columns
- Variant: `outline`
- Border: `rounded-r-md rounded-l-none border-l-0`
- Behavior: Smooth transitions with `transition-all duration-300`
- Desktop: Visible when document viewer column is present
- Mobile: Hidden when sidebar is closed

**References Section Collapse/Expand:**
- Collapsed height: `max-h-8`
- Expanded height: `max-h-96`
- Transition: `transition-all duration-300 ease-in-out`
- Indicator: Chevron icon (`IoChevronDown` when collapsed, `IoChevronUp` when expanded)
- Default state: Collapsed when no references, expanded when references exist

**Automatic Mark-as-Read:**
- Detection: Uses Intersection Observer API to detect when messages become visible
- Trigger threshold: Messages marked as read when 50% visible in the ScrollArea viewport
- Scope: Only marks messages where the current user is the receiver (not the sender)
- State tracking: Prevents duplicate marking using in-memory Set
- API endpoint: Requires `PATCH /api/hazo_chat/messages/[id]/read` route
- Visual indicator: Green double-checkmark (IoCheckmarkDoneSharp) appears after timestamp
- Automatic: No user action required - messages are marked as read automatically when scrolled into view

**Note:** The mark-as-read functionality requires:
1. The `HazoChat` component (includes all hooks and logic)
2. The API route for marking messages as read (see API Routes Setup below)
3. Messages must be received by the current user (messages sent by current user are not marked)

#### Layout Standards

**Chat Input Area:**
- Layout: Flex container with `flex items-center gap-2`
- Components: Single `Input` field and Send button (`Button` with `IoSend` icon)
- No attachment buttons: Attachment/image buttons removed for simplified design
- Input padding: `p-4` on container
- Button alignment: Aligned with input height using flex

**Button Alignment and Sizing:**
- Send button: Standard button size, aligned with input
- All interactive buttons: Consistent sizing for visual harmony
- Icon sizes within buttons: `w-4 h-4` (16px × 16px)

**Responsive Breakpoints:**
- Mobile: < 768px (default)
- Desktop: >= 768px (`md:` prefix)
- Standard Tailwind breakpoints used throughout

#### Container Requirements

**Important:** When wrapping HazoChat in containers (e.g., Card components):

1. **Container Height Requirement:**
   - The `HazoChat` component uses `h-full` which requires its parent container to have a **defined height**.
   - **Required:** Parent container must have a fixed height (e.g., `h-[600px]`, `h-screen`, `min-h-[500px]`).
   - **Example:**
     ```tsx
     <div className="h-[600px]">  {/* Required: parent must have height */}
       <HazoChat receiver_user_id={...} />
     </div>
     ```
   - **Without a defined height**, the component may not render correctly and the chat message area may collapse.

2. **Container Width Requirements:**
   - **Recommended minimum width:** 500px for optimal two-column layout (document viewer + chat messages).
   - **For narrow containers (< 500px):** Document references will automatically open in a new tab when clicked instead of showing in the preview panel.
   - **Document viewer defaults to collapsed** to maximize chat space. Users can expand it using the toggle button.
   - **Example:**
     ```tsx
     {/* Recommended: at least 500px width */}
     <div className="w-[600px] h-[600px]">
       <HazoChat receiver_user_id={...} />
     </div>
     ```

3. **Avoid nested `overflow-hidden`**: Nested overflow-hidden containers can clip rounded corners. Use overflow-hidden only on the HazoChat component itself.

4. **Padding**: If wrapping in a Card, ensure proper padding is maintained. Avoid `p-0` on CardContent as it may affect internal spacing.

5. **Tailwind Configuration**: Ensure `./node_modules/hazo_chat/dist/**/*.{js,ts,jsx,tsx}` is included in your Tailwind `content` array so all utility classes (including `rounded-*` classes) are compiled.

**Complete Container Example:**
```tsx
<div className="w-[600px] h-[600px] flex-shrink-0">
  <div className="rounded-xl border shadow-lg p-0 h-full">
    <HazoChat 
      receiver_user_id="user-123"
      title="Chat"
      className="h-full"
    />
  </div>
</div>
```

#### Typography

**Font Families:**
- Primary: System font stack or custom font via `--font-sans` CSS variable
- Monospace: System monospace or custom font via `--font-mono` CSS variable

**Font Sizes:**
- Header title: `text-sm` (14px)
- Header subtitle: `text-xs` (12px)
- Message text: `text-sm` (14px)
- Timestamp: `text-xs` (12px)
- References header: `text-[9px]` (9px)
- Empty state text: `text-sm` (14px)

#### Spacing and Padding

**Standard Padding Values:**
- Container padding: `p-4` (16px)
- Header padding: `px-4` (16px horizontal)
- Message bubble padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Gap between elements: `gap-2` (8px) or `gap-1` (4px) for tight spacing

#### Animation and Transitions

**Standard Transitions:**
- Component state changes: `transition-all duration-300`
- Hover states: `transition-colors`
- Smooth animations for expand/collapse: `ease-in-out`

**Loading States:**
- Skeleton loaders for initial message load
- Spinner animation for refresh button when loading

#### Accessibility

**ARIA Labels:**
All interactive elements must have appropriate ARIA labels:
- Input fields: `aria-label="Message input"`
- Buttons: `aria-label` describing action (e.g., "Send message", "Refresh chat history")
- Close button: `aria-label="Close chat"`
- Toggle buttons: `aria-label` and `aria-expanded` attributes

**Keyboard Navigation:**
- Send message: Enter key
- Close dialogs: Escape key (handled by Alert Dialog component)

#### Component Dependencies

**Required External Components:**
The following components must be available in consuming projects:
1. **AlertDialog** (shadcn/ui style) - Used for user acknowledgment dialogs, not included in hazo_chat package
2. **Toaster** (from `sonner` package) - Used for toast notifications, must be added to root layout with `position="top-right"` and `richColors` prop

**Included Components:**
The following UI components are included in hazo_chat package:
- Button, Input, Textarea, Avatar, ScrollArea, Tooltip, Separator, Badge
- ChatBubble (chat-specific), LoadingSkeleton (chat-specific)

**Example References:**
For complete implementation examples, see:
- `test-app/src/app/page.tsx` - Usage example
- `test-app/src/app/layout.tsx` - Toaster setup
- `test-app/src/components/ui/alert-dialog.tsx` - Alert Dialog implementation
- `test-app/src/app/globals.css` - CSS variables example
- `test-app/tailwind.config.ts` - Tailwind configuration example

## Quick Start

### Step 1: Create API Routes

The component communicates via API calls. Create the required endpoints:

```typescript
// app/api/hazo_chat/messages/route.ts
import { createMessagesHandler } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

export const dynamic = 'force-dynamic';

const { GET, POST } = createMessagesHandler({
  getHazoConnect: () => getHazoConnectSingleton()
});

export { GET, POST };
```

### Step 2: Use the Component

```tsx
'use client';

import { HazoChat } from 'hazo_chat';
import { createClientLogger } from 'hazo_logs/ui';

// Create client logger (required in v4.0+)
const logger = createClientLogger({ packageName: 'hazo_chat' });

export default function ChatPage() {
  return (
    <div className="h-screen">
      <HazoChat
        chat_group_id="group-uuid"
        logger={logger}
        reference_id="conversation-123"
        reference_type="support"
        title="Chat with Support"
        subtitle="We're here to help"
      />
    </div>
  );
}
```

That's it! No need to pass database adapters or authentication services - everything works via API calls.

## API Routes Setup

hazo_chat requires these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hazo_chat/messages` | GET | Fetch chat messages (requires `chat_group_id` param) |
| `/api/hazo_chat/messages` | POST | Send a new message (requires `chat_group_id` in body) |
| `/api/hazo_chat/messages/[id]/read` | PATCH | Mark a message as read (automatic) |
| `/api/hazo_chat/unread_count` | GET | Get unread message counts by chat_group_id (optional) |
| `/api/hazo_auth/me` | GET | Get current authenticated user |
| `/api/hazo_auth/profiles` | POST | Fetch user profiles by IDs |

**Breaking Change (v3.0):** Messages API now uses `chat_group_id` instead of `receiver_user_id`. All group members can see and send messages.

### Using Exportable Handlers (Recommended)

```typescript
// app/api/hazo_chat/messages/route.ts
import { createMessagesHandler } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

export const dynamic = 'force-dynamic';

const { GET, POST } = createMessagesHandler({
  getHazoConnect: () => getHazoConnectSingleton(),
  // Optional: custom authentication
  getUserIdFromRequest: async (request) => {
    // Return user ID from your auth system
    return request.cookies.get('user_id')?.value || null;
  }
});

export { GET, POST };
```

```typescript
// app/api/hazo_chat/messages/[id]/read/route.ts
import { NextRequest } from 'next/server';
import { createMarkAsReadHandler } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

export const dynamic = 'force-dynamic';

const { PATCH } = createMarkAsReadHandler({
  getHazoConnect: () => getHazoConnectSingleton(),
  // Optional: custom authentication
  getUserIdFromRequest: async (request) => {
    // Return user ID from your auth system
    return request.cookies.get('user_id')?.value || null;
  }
});

// Wrapper to handle Next.js App Router params
async function handlePATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

export { handlePATCH as PATCH };
```

### Custom Implementation

If you need more control, implement the endpoints manually. See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for detailed examples.

## Library Functions

hazo_chat provides server-side library functions that can be used in API routes, server components, or server actions.

### hazo_chat_get_unread_count

Get unread message counts grouped by chat_group_id for a user.

**Purpose:** Returns an array of chat group IDs with the count of unread messages (where `read_at` is `null`) for a given user ID. Useful for displaying unread message badges or notifications.

**Breaking Change (v3.0):** Now groups by `chat_group_id` instead of `reference_id`. Accepts optional `chat_group_ids` filter.

**Usage:**

```typescript
import { createUnreadCountFunction } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

// Create the function using the factory
const hazo_chat_get_unread_count = createUnreadCountFunction({
  getHazoConnect: () => getHazoConnectSingleton()
});

// Use the function
const unreadCounts = await hazo_chat_get_unread_count({
  user_id: 'user-id-123',
  chat_group_ids: ['group-1', 'group-2'] // Optional: filter by specific groups
});
// Returns: [
//   { chat_group_id: 'group-1', count: 5 },
//   { chat_group_id: 'group-2', count: 3 }
// ]
```

**Return Type:**

```typescript
interface UnreadCountResult {
  chat_group_id: string; // The chat group ID
  count: number;         // Number of unread messages in this group
}
```

**Function Behavior:**
- Only counts messages where `read_at` is `null` and `deleted_at` is `null`
- Only counts messages in groups where the user is a member
- Groups results by `chat_group_id`
- Optionally filters by specific `chat_group_ids` if provided
- Sorts results by count (descending - most unread first)
- Returns empty array if no unread messages found
- Returns empty array on errors (doesn't throw)

**Example: API Route Implementation**

```typescript
// app/api/hazo_chat/unread_count/route.ts
import { createUnreadCountFunction } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    const chat_group_ids = chat_group_ids_param
      ? chat_group_ids_param.split(',')
      : undefined;

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

**Example: Server Component Usage**

```typescript
// app/chat/unread-badge.tsx
import { createUnreadCountFunction } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

const hazo_chat_get_unread_count = createUnreadCountFunction({
  getHazoConnect: () => getHazoConnectSingleton()
});

export default async function UnreadBadge({ 
  receiver_user_id 
}: { 
  receiver_user_id: string 
}) {
  const unread_counts = await hazo_chat_get_unread_count(receiver_user_id);
  const total_unread = unread_counts.reduce((sum, item) => sum + item.count, 0);

  if (total_unread === 0) return null;

  return (
    <div className="flex gap-2">
      {unread_counts.map((item) => (
        <div key={item.reference_id || 'general'}>
          <span>{item.reference_id || 'General'}: {item.count}</span>
        </div>
      ))}
      <span>Total: {total_unread}</span>
    </div>
  );
}
```

**Example: Server Action Usage**

```typescript
// app/actions/chat.ts
'use server';

import { createUnreadCountFunction } from 'hazo_chat/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

const hazo_chat_get_unread_count = createUnreadCountFunction({
  getHazoConnect: () => getHazoConnectSingleton()
});

export async function getUnreadCounts(receiver_user_id: string) {
  return await hazo_chat_get_unread_count(receiver_user_id);
}
```

## Props Reference

### HazoChatProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `chat_group_id` | `string` | ✅ | - | UUID of the chat group (CHANGED from `receiver_user_id` in v3.0) |
| `logger` | `ClientLogger` | ✅ | - | Logger instance from hazo_logs/ui (NEW in v4.0) |
| `read_only` | `boolean` | ❌ | `false` | When true, hides chat input for view-only mode (NEW in v4.0.4) |
| `reference_id` | `string` | ❌ | - | Reference ID for chat context grouping |
| `reference_type` | `string` | ❌ | `'chat'` | Type of reference |
| `api_base_url` | `string` | ❌ | `'/api/hazo_chat'` | Base URL for API endpoints |
| `realtime_mode` | `'polling' \| 'manual'` | ❌ | `'polling'` | Real-time update mode: `'polling'` (automatic) or `'manual'` (refresh only) |
| `polling_interval` | `number` | ❌ | `5000` | Polling interval in ms (only used when `realtime_mode = 'polling'`) |
| `messages_per_page` | `number` | ❌ | `20` | Number of messages per page for pagination |
| `additional_references` | `ReferenceItem[]` | ❌ | `[]` | Pre-loaded document references |
| `timezone` | `string` | ❌ | `'GMT+10'` | Timezone for timestamps |
| `title` | `string` | ❌ | - | Chat header title |
| `subtitle` | `string` | ❌ | - | Chat header subtitle |
| `on_close` | `() => void` | ❌ | - | Close button callback |
| `show_sidebar_toggle` | `boolean` | ❌ | `false` | Show sidebar toggle button (hamburger menu) |
| `show_delete_button` | `boolean` | ❌ | `true` | Show delete button on chat bubbles |
| `bubble_radius` | `'default' \| 'full'` | ❌ | `'default'` | Bubble border radius style: `'default'` (rounded with tail) or `'full'` (fully round) |
| `className` | `string` | ❌ | - | Additional CSS classes |

### Example with All Props

```tsx
import { createClientLogger } from 'hazo_logs/ui';

const logger = createClientLogger({ packageName: 'hazo_chat' });

<HazoChat
  chat_group_id="group-123"
  logger={logger}
  reference_id="project-456"
  reference_type="project_chat"
  api_base_url="/api/hazo_chat"
  realtime_mode="polling"        // or "manual" for refresh-only updates
  polling_interval={5000}         // only used when realtime_mode = "polling"
  timezone="Australia/Sydney"
  title="Project Discussion"
  subtitle="Design Review"
  additional_references={[
    { id: 'doc-1', type: 'document', name: 'Design.pdf', url: '/files/design.pdf', scope: 'field' }
  ]}
  on_close={() => console.log('Chat closed')}
  read_only={false}               // set to true for view-only mode
  className="h-[600px]"
/>
```

## Customization

hazo_chat provides props to customize component appearance and behavior without needing CSS overrides. This eliminates the need for extensive CSS customizations in consuming projects.

### Common Customizations

#### Read-Only Mode (View Only)

To display chat messages without allowing users to send new messages:

```tsx
<HazoChat
  chat_group_id="group-123"
  logger={logger}
  read_only={true}  // Hides chat input - view only
/>
```

Use cases:
- Displaying archived conversations
- Showing chat history to non-participants
- Read-only audit views

#### Hide Sidebar Toggle Button (Hamburger Menu)

By default, the sidebar toggle button is hidden (`show_sidebar_toggle={false}`). To show it:

```tsx
<HazoChat
  chat_group_id="group-123"
  logger={logger}
  show_sidebar_toggle={true}  // Show hamburger menu button
/>
```

#### Hide Delete Button on Chat Bubbles

To hide the delete button on chat bubbles:

```tsx
<HazoChat
  chat_group_id="group-123"
  logger={logger}
  show_delete_button={false}  // Hide delete button
/>
```

#### Make Chat Bubbles Fully Round

To make all chat bubbles fully round (instead of the default style with a tail):

```tsx
<HazoChat
  chat_group_id="group-123"
  logger={logger}
  bubble_radius="full"  // Fully round all corners
/>
```

### Customization Props Summary

| Prop | Default | Options | Description |
|------|--------|---------|------------|
| `read_only` | `false` | `boolean` | Hide chat input for view-only mode |
| `show_sidebar_toggle` | `false` | `boolean` | Show/hide the hamburger menu button |
| `show_delete_button` | `true` | `boolean` | Show/hide delete button on chat bubbles |
| `bubble_radius` | `'default'` | `'default' \| 'full'` | Bubble border radius style |

### Example: Full Customization

```tsx
<HazoChat
  chat_group_id="group-123"
  logger={logger}
  reference_id="project-456"
  read_only={false}               // Set true for view-only mode
  show_sidebar_toggle={false}     // Hide hamburger menu
  show_delete_button={false}      // Hide delete buttons
  bubble_radius="full"            // Fully round bubbles
  title="Project Chat"
  className="h-[600px]"
/>
```

### Why Use Props Instead of CSS?

Using props instead of CSS overrides provides:
- **Type safety**: TypeScript will catch invalid values
- **Consistency**: Ensures all instances use the same styling
- **Maintainability**: Easier to update across the codebase
- **No CSS conflicts**: Avoids specificity issues with Tailwind utilities

If you need more advanced styling that isn't covered by props, you can still use CSS overrides, but props should cover most common customization needs.

## Checking for Messages

If you need to check whether messages exist for a given reference (without loading all messages), you can call the messages API endpoint directly. This is useful for showing indicators or badges.

**Important:** The API requires `receiver_user_id` as a query parameter and returns an object response, not a direct array.

### Correct API Usage Pattern

```typescript
// ✅ CORRECT: Include receiver_user_id and handle object response
async function checkMessagesExist(
  recipient_user_id: string,
  reference_id: string,
  reference_type?: string
): Promise<boolean> {
  const params = new URLSearchParams({
    receiver_user_id: recipient_user_id,  // ✅ Required parameter
    reference_id,
    ...(reference_type && { reference_type }),
  });

  const response = await fetch(`/api/hazo_chat/messages?${params.toString()}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  
  // ✅ Handle object response format: { success: true, messages: [], current_user_id }
  const messages = data.messages || data;  // Handle both object and array responses
  const has_messages_result = Array.isArray(messages) && messages.length > 0;
  
  return has_messages_result;
}
```

### Common Mistakes to Avoid

```typescript
// ❌ WRONG: Missing receiver_user_id parameter
const params = new URLSearchParams({
  reference_id,
  ...(reference_type && { reference_type }),
});
// This will return a 400 error: "receiver_user_id is required"

// ❌ WRONG: Expecting direct array response
const data = await response.json();
const has_messages_result = Array.isArray(data) && data.length > 0;
// This fails because API returns: { success: true, messages: [], current_user_id }
```

### Example: Custom Hook Implementation

```typescript
'use client';

import { useState, useEffect } from 'react';

function useChatMessagesCheck(
  recipient_user_id: string,
  reference_id: string,
  reference_type?: string
) {
  const [has_messages, set_has_messages] = useState(false);
  const [is_checking, set_is_checking] = useState(true);

  useEffect(() => {
    async function check() {
      if (!recipient_user_id || !reference_id) {
        set_is_checking(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          receiver_user_id: recipient_user_id,  // ✅ Required
          reference_id,
          ...(reference_type && { reference_type }),
        });

        const response = await fetch(
          `/api/hazo_chat/messages?${params.toString()}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || data;  // ✅ Handle object response
          set_has_messages(Array.isArray(messages) && messages.length > 0);
        }
      } catch (error) {
        console.error('[useChatMessagesCheck] Error:', error);
        set_has_messages(false);
      } finally {
        set_is_checking(false);
      }
    }

    check();
  }, [recipient_user_id, reference_id, reference_type]);

  return { has_messages, is_checking };
}
```

## Hooks

### useChatMessages

Manages chat messages with pagination, polling, and CRUD operations.

```tsx
import { useChatMessages } from 'hazo_chat';

const {
  messages,           // ChatMessage[] - All loaded messages
  is_loading,         // boolean - Initial loading state
  is_loading_more,    // boolean - Pagination loading state
  has_more,           // boolean - More messages available
  error,              // string | null - Error message
  polling_status,     // 'connected' | 'reconnecting' | 'error'
  load_more,          // () => void - Load older messages
  send_message,       // (payload) => Promise<boolean>
  delete_message,     // (message_id) => Promise<boolean>
  mark_as_read,       // (message_id) => Promise<void>
  refresh,            // () => void - Reload messages
} = useChatMessages({
  chat_group_id: 'group-456',  // CHANGED from receiver_user_id in v3.0
  reference_id: 'chat-123',
  reference_type: 'direct',
  api_base_url: '/api/hazo_chat',
  realtime_mode: 'polling',   // Optional: 'polling' (automatic) or 'manual' (refresh only), default: 'polling'
  polling_interval: 5000,      // Optional, default: 5000ms (only used when realtime_mode = 'polling')
  messages_per_page: 20,       // Optional, default: 20
});
```

### useChatReferences

Manages document references across messages and props.

```tsx
import { useChatReferences } from 'hazo_chat';

const {
  references,              // ChatReferenceItem[] - All references
  selected_reference,      // ChatReferenceItem | null
  select_reference,        // (ref) => void
  clear_selection,         // () => void
  add_reference,           // (ref) => void
  get_message_for_reference, // (ref_id) => string | null
} = useChatReferences({
  messages,
  initial_references: [],
  on_selection_change: (ref) => console.log('Selected:', ref),
});
```

### useFileUpload

Handles file validation, preview, and upload.

```tsx
import { useFileUpload } from 'hazo_chat';

const {
  pending_attachments,  // PendingAttachment[]
  add_files,            // (files: File[]) => void
  remove_file,          // (id: string) => void
  upload_all,           // () => Promise<UploadedFile[]>
  clear_all,            // () => void
  is_uploading,         // boolean
  validation_errors,    // string[]
} = useFileUpload({
  upload_location: '/api/hazo_chat/uploads',
  max_file_size_mb: 10,                  // Optional, default: 10
  allowed_types: ['pdf', 'png', 'jpg'],  // Optional
});
```

## Types

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  reference_id: string;
  reference_type: string;
  sender_user_id: string;
  chat_group_id: string;  // CHANGED from receiver_user_id in v3.0
  message_text: string | null;
  reference_list: ChatReferenceItem[] | null;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
  changed_at: string;
  sender_profile?: HazoUserProfile;
  // receiver_profile removed in v3.0
  is_sender: boolean;
  send_status?: 'sending' | 'sent' | 'failed';
}
```

### HazoUserProfile

```typescript
interface HazoUserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}
```

### ChatReferenceItem

```typescript
interface ChatReferenceItem {
  id: string;
  type: 'document' | 'field' | 'url';
  scope: 'chat' | 'field';
  name: string;
  url: string;
  mime_type?: string;
  file_size?: number;
  message_id?: string;
}
```

**Note on MIME Type:** The `mime_type` property is optional. If not provided, the component will automatically infer the MIME type from the file extension (e.g., `.jpg` → `image/jpeg`, `.pdf` → `application/pdf`). This ensures document preview works even when `mime_type` is not explicitly set. Supported file extensions for inference include: `pdf`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `txt`, `doc`, `docx`.

### ChatGroup (NEW in v3.0, UPDATED in v3.1)

```typescript
interface ChatGroup {
  id: string;
  client_user_id: string | null | undefined;  // NULLABLE in v3.1 (only required for 'support' groups)
  group_type: ChatGroupType;                   // NEW in v3.1
  name?: string | null;
  created_at: string;
  changed_at: string;
}
```

### ChatGroupType (NEW in v3.1)

```typescript
type ChatGroupType = 'support' | 'peer' | 'group';
```

**Group Type Definitions:**
- `'support'`: Client-to-staff support conversation (requires `client_user_id`)
- `'peer'`: Peer-to-peer direct message between two users
- `'group'`: Multi-user group conversation

### ChatGroupUser (NEW in v3.0, UPDATED in v3.1)

```typescript
interface ChatGroupUser {
  chat_group_id: string;
  user_id: string;
  role: ChatGroupUserRole;  // EXPANDED in v3.1
  created_at: string;
  changed_at: string;
}
```

### ChatGroupUserRole (NEW in v3.0, EXPANDED in v3.1)

```typescript
// v3.0
type ChatGroupUserRole = 'client' | 'staff';

// v3.1 (expanded)
type ChatGroupUserRole = 'client' | 'staff' | 'owner' | 'admin' | 'member';
```

**Role Definitions:**
- `'client'`: Customer/end-user in support scenarios
- `'staff'`: Support personnel in support scenarios
- `'owner'`: Creator/owner of peer or group chats
- `'admin'`: Delegated administrator in group chats
- `'member'`: Standard participant in peer or group chats

### ChatGroupWithMembers (NEW in v3.0, UPDATED in v3.1)

```typescript
interface ChatGroupWithMembers extends ChatGroup {
  members: (ChatGroupUser & { profile?: HazoUserProfile })[];
  owner_profile?: HazoUserProfile;  // NEW in v3.1 - profile of the group owner
}
```

## Database Schema

**Breaking Changes in v3.0:** The database schema has been updated to support group-based chat. Migration required.

**New in v3.1:** Generic schema supporting multiple chat patterns - support, peer, and group conversations.

### PostgreSQL Enum Types (RECOMMENDED)

For PostgreSQL installations, create these custom enum types for type safety and consistency:

```sql
-- Reference type for chat contexts
CREATE TYPE hazo_enum_chat_type AS ENUM ('chat', 'field', 'project', 'support', 'general');

-- Group type for conversation patterns (v3.1)
CREATE TYPE hazo_enum_group_type AS ENUM ('support', 'peer', 'group');

-- Membership roles (v3.1)
CREATE TYPE hazo_enum_group_role AS ENUM ('client', 'staff', 'owner', 'admin', 'member');
```

### Group Types

hazo_chat supports three distinct group types to accommodate different conversation patterns:

| Type | Description | Use Case | `client_user_id` | Typical Roles |
|------|-------------|----------|------------------|---------------|
| **support** | Client-to-staff support conversation | Customer support, helpdesk | Required (identifies the client) | 'client', 'staff' |
| **peer** | Peer-to-peer direct message (1:1) | Direct messaging between equals | Not used (null) | 'owner', 'member' |
| **group** | Multi-user group conversation | Team collaboration, channels | Not used (null) | 'owner', 'admin', 'member' |

### Role Types

The `role` field in `hazo_chat_group_users` defines each member's permissions and relationship to the group:

| Role | Description | Used In | Capabilities |
|------|-------------|---------|--------------|
| **client** | Customer/end-user receiving support | support groups | Send messages, view messages |
| **staff** | Support personnel helping clients | support groups | Send messages, view messages, assist client |
| **owner** | Creator/owner of the conversation | peer, group | Full control, can add/remove members |
| **admin** | Delegated administrator | group | Can manage members, moderate content |
| **member** | Standard participant | peer, group | Send messages, view messages |

### hazo_chat_group Table (UPDATED in v3.1)

```sql
-- PostgreSQL with enums (RECOMMENDED)
CREATE TABLE hazo_chat_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID REFERENCES hazo_users(id),  -- NULLABLE in v3.1
  group_type hazo_enum_group_type NOT NULL DEFAULT 'support',  -- NEW in v3.1
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostgreSQL without enums (alternative)
CREATE TABLE hazo_chat_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID REFERENCES hazo_users(id),  -- NULLABLE in v3.1
  group_type VARCHAR(20) NOT NULL DEFAULT 'support' CHECK (group_type IN ('support', 'peer', 'group')),  -- NEW in v3.1
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hazo_chat_group_client ON hazo_chat_group(client_user_id);
CREATE INDEX idx_hazo_chat_group_type ON hazo_chat_group(group_type);  -- NEW in v3.1
```

**Column Changes in v3.1:**
- `client_user_id`: Changed from `NOT NULL` to nullable - only required for 'support' type groups
- `group_type`: NEW field - defines the conversation pattern ('support', 'peer', 'group')

### hazo_chat_group_users Table (UPDATED in v3.1)

```sql
-- PostgreSQL with enums (RECOMMENDED)
CREATE TABLE hazo_chat_group_users (
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES hazo_users(id) ON DELETE CASCADE,
  role hazo_enum_group_role NOT NULL,  -- EXPANDED in v3.1
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_group_id, user_id)
);

-- PostgreSQL without enums (alternative)
CREATE TABLE hazo_chat_group_users (
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES hazo_users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'staff', 'owner', 'admin', 'member')),  -- EXPANDED in v3.1
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_group_id, user_id)
);

CREATE INDEX idx_hazo_chat_group_users_user ON hazo_chat_group_users(user_id);
CREATE INDEX idx_hazo_chat_group_users_group ON hazo_chat_group_users(chat_group_id);
CREATE INDEX idx_hazo_chat_group_users_role ON hazo_chat_group_users(role);  -- NEW in v3.1
```

**Column Changes in v3.1:**
- `role`: EXPANDED from ('client', 'staff') to ('client', 'staff', 'owner', 'admin', 'member')

### hazo_chat Table (MODIFIED in v3.0)

```sql
-- PostgreSQL
CREATE TABLE hazo_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID NOT NULL,
  reference_type TEXT DEFAULT 'chat',
  sender_user_id UUID NOT NULL REFERENCES hazo_users(id),
  chat_group_id UUID NOT NULL REFERENCES hazo_chat_group(id),  -- CHANGED from receiver_user_id
  message_text TEXT,
  reference_list JSONB,  -- JSON array of ChatReferenceItem
  read_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_hazo_chat_reference_id ON hazo_chat(reference_id);
CREATE INDEX idx_hazo_chat_sender ON hazo_chat(sender_user_id);
CREATE INDEX idx_hazo_chat_group ON hazo_chat(chat_group_id);  -- CHANGED from receiver index
CREATE INDEX idx_hazo_chat_created ON hazo_chat(created_at DESC);
```

**Migration Notes:**
- Rename column: `receiver_user_id` → `chat_group_id`
- Create new tables: `hazo_chat_group`, `hazo_chat_group_users`
- Migrate existing 1-1 chats to groups with both users as members
- Update foreign key constraints

## UI Behavior & Responsive Design

### Hamburger Menu Button

The hamburger menu button (☰) appears in the chat header **only on mobile devices** (screens < 768px wide) and is used to toggle the document viewer sidebar.

**Desktop Behavior:**
- The hamburger button is **hidden** (`md:hidden` class)
- The document viewer is always visible as a left column
- Use the expand/collapse toggle button (chevron) between the document viewer and chat area to show/hide the document viewer

**Mobile Behavior:**
- The hamburger button is **visible** to toggle the document viewer overlay
- The document viewer slides in from the left as an overlay when opened
- Click the hamburger button or backdrop to toggle the sidebar

**Important:** If you see the hamburger button on desktop, it may indicate:
1. TailwindCSS classes are not being compiled correctly in your project
2. The `md:` breakpoint utilities are not available in your Tailwind config
3. Ensure `tailwindcss` is properly installed and configured in your consuming project

### Document Viewer Toggle

The document viewer column can be collapsed/expanded using a toggle button (chevron icon) positioned between the document viewer and chat area. This button:
- Appears on desktop when the document viewer is visible
- Allows you to collapse the document viewer to maximize chat space
- Automatically positions itself at the edge of the expanded/collapsed viewer

### Chat Input Area

The chat input area includes:
- File attachment button (left side)
- Image attachment button
- Auto-resizing text input
- Send button (aligned with textarea height)

All buttons are sized consistently (`h-10 w-10`) to align properly with the text input area.

## Configuration

### config/hazo_chat_config.ini (Optional)

Configuration files are stored in the `config/` directory. Consuming applications should also use a `config/` directory to store their configuration files for consistency across hazo packages.

```ini
[chat]
# Real-time update mode: "polling" (automatic) or "manual" (refresh only)
# polling: Automatically checks for new messages at the specified interval
# manual: Only updates when user manually refreshes (via refresh button)
realtime_mode = polling

# Polling interval in milliseconds (only used when realtime_mode = polling)
polling_interval = 5000

# Messages to load per page
messages_per_page = 20

[uploads]
# Maximum file size in MB
max_file_size_mb = 10

# Allowed file extensions (comma-separated)
allowed_types = pdf,png,jpg,jpeg,gif,txt,doc,docx
```

## Migration from v3.0 to v3.1

**Version 3.1** introduces schema changes to support multiple chat patterns (support, peer, group) while maintaining backward compatibility.

### What Changed in v3.1

| v3.0 | v3.1 |
|------|------|
| Fixed support pattern only | Three patterns: support, peer, group |
| `client_user_id` always required | `client_user_id` nullable (only for support groups) |
| 2 roles: 'client', 'staff' | 5 roles: 'client', 'staff', 'owner', 'admin', 'member' |
| No `group_type` field | NEW `group_type` field ('support', 'peer', 'group') |

### Migration Steps (v3.0 to v3.1)

**Important:** v3.1 is backward compatible with v3.0 schema. Existing support-type groups continue to work without changes.

1. **Create PostgreSQL Enum Types (Optional but Recommended):**

```sql
-- Reference type for chat contexts
CREATE TYPE hazo_enum_chat_type AS ENUM ('chat', 'field', 'project', 'support', 'general');

-- Group type for conversation patterns
CREATE TYPE hazo_enum_group_type AS ENUM ('support', 'peer', 'group');

-- Membership roles
CREATE TYPE hazo_enum_group_role AS ENUM ('client', 'staff', 'owner', 'admin', 'member');
```

2. **Add group_type Column to hazo_chat_group:**

```sql
-- Add group_type column (defaults to 'support' for backward compatibility)
ALTER TABLE hazo_chat_group
  ADD COLUMN group_type VARCHAR(20) NOT NULL DEFAULT 'support'
  CHECK (group_type IN ('support', 'peer', 'group'));

-- Or with enum type (if you created the enum):
ALTER TABLE hazo_chat_group
  ADD COLUMN group_type hazo_enum_group_type NOT NULL DEFAULT 'support';

-- Add index for group_type
CREATE INDEX idx_hazo_chat_group_type ON hazo_chat_group(group_type);
```

3. **Make client_user_id Nullable:**

```sql
-- Remove NOT NULL constraint from client_user_id
ALTER TABLE hazo_chat_group
  ALTER COLUMN client_user_id DROP NOT NULL;
```

4. **Update Role Constraint in hazo_chat_group_users:**

```sql
-- Drop old constraint
ALTER TABLE hazo_chat_group_users
  DROP CONSTRAINT IF EXISTS hazo_chat_group_users_role_check;

-- Add new constraint with expanded roles
ALTER TABLE hazo_chat_group_users
  ADD CONSTRAINT hazo_chat_group_users_role_check
  CHECK (role IN ('client', 'staff', 'owner', 'admin', 'member'));

-- Or with enum type (if you created the enum):
ALTER TABLE hazo_chat_group_users
  ALTER COLUMN role TYPE hazo_enum_group_role
  USING role::hazo_enum_group_role;

-- Add index for role
CREATE INDEX idx_hazo_chat_group_users_role ON hazo_chat_group_users(role);
```

5. **Verify Existing Data:**

```sql
-- All existing groups should have group_type = 'support'
SELECT group_type, COUNT(*)
FROM hazo_chat_group
GROUP BY group_type;

-- All existing members should have role IN ('client', 'staff')
SELECT role, COUNT(*)
FROM hazo_chat_group_users
GROUP BY role;
```

### Creating New Group Types

After migration, you can create peer and group conversations:

```typescript
// Support group (v3.0 style - still works)
await db.insert_with_result('hazo_chat_group', {
  client_user_id: 'client-uuid',
  group_type: 'support',
  name: 'Customer Support'
});

// Peer-to-peer chat (v3.1)
await db.insert_with_result('hazo_chat_group', {
  client_user_id: null,  // Not used for peer chats
  group_type: 'peer',
  name: 'Alice & Bob'
});

// Group conversation (v3.1)
await db.insert_with_result('hazo_chat_group', {
  client_user_id: null,  // Not used for group chats
  group_type: 'group',
  name: 'Project Team'
});
```

### No Code Changes Required

The v3.1 schema changes are transparent to the component API. Your existing code continues to work:

```tsx
// This works for all group types (support, peer, group)
<HazoChat
  chat_group_id="group-123"
  reference_id="chat-456"
  reference_type="support"
/>
```

### TypeScript Type Updates

If you use TypeScript types from hazo_chat:

```typescript
// v3.1 types (automatically available after updating package)
import type {
  ChatGroup,           // client_user_id is now optional
  ChatGroupType,       // 'support' | 'peer' | 'group'
  ChatGroupUserRole    // 'client' | 'staff' | 'owner' | 'admin' | 'member'
} from 'hazo_chat';

const group: ChatGroup = {
  id: 'group-123',
  client_user_id: null,        // ✅ Now optional
  group_type: 'peer',          // ✅ New field
  name: 'Chat',
  created_at: new Date().toISOString(),
  changed_at: new Date().toISOString()
};
```

## Migration from v2.x to v3.0

**Version 3.0** introduces breaking changes to support group-based chat architecture.

### What Changed

| v2.x | v3.0 |
|------|------|
| `receiver_user_id` prop | `chat_group_id` prop |
| 1-1 chat only | Group-based chat with multiple participants |
| `receiver_user_id` in API calls | `chat_group_id` in API calls |
| Single `hazo_chat` table | Three tables: `hazo_chat_group`, `hazo_chat_group_users`, `hazo_chat` (modified) |
| Unread count by `reference_id` | Unread count by `chat_group_id` |
| `ChatMessage.receiver_profile` field | Field removed |

### Migration Steps

1. **Database Migration:**

```sql
-- Step 1: Create new tables
CREATE TABLE hazo_chat_group (...);  -- See Database Schema section
CREATE TABLE hazo_chat_group_users (...);

-- Step 2: Migrate existing data (example)
-- For each unique sender-receiver pair, create a chat group
INSERT INTO hazo_chat_group (id, client_user_id, name)
SELECT
  gen_random_uuid(),
  receiver_user_id,
  'Migrated Chat ' || sender_user_id
FROM hazo_chat
GROUP BY sender_user_id, receiver_user_id;

-- Step 3: Rename column
ALTER TABLE hazo_chat RENAME COLUMN receiver_user_id TO chat_group_id;

-- Step 4: Update foreign keys
ALTER TABLE hazo_chat
  ADD CONSTRAINT fk_chat_group
  FOREIGN KEY (chat_group_id)
  REFERENCES hazo_chat_group(id);
```

2. **Update Component Props:**

```tsx
// Before (v2.x)
<HazoChat
  receiver_user_id="user-123"
  reference_id="chat-456"
/>

// After (v3.0)
<HazoChat
  chat_group_id="group-123"
  reference_id="chat-456"
/>
```

3. **Update API Calls:**

```typescript
// Before (v2.x)
const response = await fetch(
  `/api/hazo_chat/messages?receiver_user_id=${userId}`
);

// After (v3.0)
const response = await fetch(
  `/api/hazo_chat/messages?chat_group_id=${groupId}`
);
```

4. **Update Type References:**

```typescript
// Remove receiver_profile usage
// message.receiver_profile → removed

// Update CreateMessagePayload
// receiver_user_id → chat_group_id
```

### Why the Change?

The v2.x architecture supported only 1-1 communication. This was limiting for scenarios where:

- Multiple support staff need to rotate on a single client chat
- Team collaboration is required within a chat context
- Client needs to see all staff responses in one unified thread

The v3.0 group-based architecture solves these by:

- Supporting multiple users in a single chat group
- Role-based access (client vs staff)
- Unified message history for all group members
- Better scalability for team-based support scenarios

## Migration from v1.x to v2.0

Version 2.0 introduced API-first architecture (no server-side dependencies in client components).

See [v2.0 release notes](https://github.com/pub12/hazo_chat/releases/tag/v2.0.0) for details.

## Development

### Building the Package

```bash
# Clean and build
npm run build

# Watch mode
npm run dev:package
```

### Running Test App

```bash
# Build package and start test app
npm run dev:test-app

# Or build both for production
npm run build:test-app
```

### Package Exports

```typescript
// Main export
import { HazoChat, useChatMessages, useChatReferences, useFileUpload } from 'hazo_chat';

// API handlers (for server-side routes)
import { createMessagesHandler, createUnreadCountFunction } from 'hazo_chat/api';

// Components only
import { HazoChat, ChatBubble } from 'hazo_chat/components';

// Library utilities
import { DEFAULT_POLLING_INTERVAL, MIME_TYPE_MAP } from 'hazo_chat/lib';
```

## Troubleshooting

### Common Issues

1. **"Module not found: Can't resolve 'fs'"**
   - This shouldn't happen in v2.x. If it does, ensure you're not importing from `hazo_connect/server` in client components.

2. **Messages not loading**
   - Check that API routes exist and return correct responses
   - Verify authentication (check `/api/hazo_auth/me`)
   - Check browser console and network tab for errors

3. **401 Unauthorized errors**
   - Ensure the user is logged in
   - Check that `hazo_auth_user_id` cookie is set

4. **CORS errors**
   - API routes should be on the same domain as the frontend

5. **UI components not styled correctly**
   - Ensure Tailwind config includes hazo_chat package paths in `content` array
   - Verify CSS variables are defined in `globals.css`
   - Check that all UI dependencies are installed (see [UI Requirements](#ui-requirements))
   - Rebuild CSS: `rm -rf .next` and restart dev server

6. **Toast notifications not appearing**
   - Ensure Sonner Toaster is added to root layout (see [UI Requirements](#ui-requirements))
   - Check that `sonner` package is installed
   - Verify `<Toaster position="top-right" richColors />` is in layout body

7. **Alert Dialog not working**
   - Create Alert Dialog component at `src/components/ui/alert-dialog.tsx`
   - See `test-app/src/components/ui/alert-dialog.tsx` for reference implementation
   - Ensure `@radix-ui/react-alert-dialog` is installed

## Related Packages

- [hazo_connect](https://github.com/pub12/hazo_connect) - Database adapter
- [hazo_auth](https://github.com/pub12/hazo_auth) - Authentication service
- [hazo_config](https://github.com/pub12/hazo_config) - Configuration management

## License

MIT © Pubs Abayasiri

---

For detailed setup instructions, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md).
