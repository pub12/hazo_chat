# hazo_chat

A full-featured React chat component library for 1-1 communication with document sharing, file attachments, and real-time messaging capabilities.

**Version 2.0** - Now with API-first architecture! No server-side dependencies in client components.

## Features

- 📱 **Responsive Design** - Works on desktop and mobile with adaptive layout
- 💬 **Real-time Messaging** - Polling-based message updates with optimistic UI
- 📎 **File Attachments** - Support for documents and images with preview
- 📄 **Document Viewer** - Built-in PDF and image viewer
- 👤 **User Profiles** - Avatar display and user information
- 🔄 **Infinite Scroll** - Cursor-based pagination for message history
- ✅ **Read Receipts** - Track message read status
- 🗑️ **Soft Delete** - Delete messages with undo capability
- 🎨 **Customizable** - TailwindCSS-based theming
- 🚀 **API-First** - No server-side dependencies in client components

## Table of Contents

- [Installation](#installation)
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
npm install hazo_chat hazo_connect next
```

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

export default function ChatPage() {
  return (
    <div className="h-screen">
      <HazoChat
        receiver_user_id="recipient-uuid"
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
| `/api/hazo_chat/messages` | GET | Fetch chat messages |
| `/api/hazo_chat/messages` | POST | Send a new message |
| `/api/hazo_auth/me` | GET | Get current authenticated user |
| `/api/hazo_auth/profiles` | POST | Fetch user profiles by IDs |

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

### Custom Implementation

If you need more control, implement the endpoints manually. See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for detailed examples.

## Props Reference

### HazoChatProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `receiver_user_id` | `string` | ✅ | - | UUID of the chat recipient |
| `reference_id` | `string` | ❌ | - | Reference ID for chat context grouping |
| `reference_type` | `string` | ❌ | `'chat'` | Type of reference |
| `api_base_url` | `string` | ❌ | `'/api/hazo_chat'` | Base URL for API endpoints |
| `additional_references` | `ReferenceItem[]` | ❌ | `[]` | Pre-loaded document references |
| `timezone` | `string` | ❌ | `'GMT+10'` | Timezone for timestamps |
| `title` | `string` | ❌ | - | Chat header title |
| `subtitle` | `string` | ❌ | - | Chat header subtitle |
| `on_close` | `() => void` | ❌ | - | Close button callback |
| `className` | `string` | ❌ | - | Additional CSS classes |

### Example with All Props

```tsx
<HazoChat
  receiver_user_id="user-123"
  reference_id="project-456"
  reference_type="project_chat"
  api_base_url="/api/hazo_chat"
  timezone="Australia/Sydney"
  title="Project Discussion"
  subtitle="Design Review"
  additional_references={[
    { id: 'doc-1', type: 'document', name: 'Design.pdf', url: '/files/design.pdf', scope: 'field' }
  ]}
  on_close={() => console.log('Chat closed')}
  className="h-[600px]"
/>
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
  receiver_user_id: 'user-456',
  reference_id: 'chat-123',
  reference_type: 'direct',
  api_base_url: '/api/hazo_chat',
  polling_interval: 5000,    // Optional, default: 5000ms
  messages_per_page: 20,     // Optional, default: 20
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
  receiver_user_id: string;
  message_text: string | null;
  reference_list: ChatReferenceItem[] | null;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
  changed_at: string;
  sender_profile?: HazoUserProfile;
  receiver_profile?: HazoUserProfile;
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

## Database Schema

### hazo_chat Table

```sql
CREATE TABLE hazo_chat (
  id TEXT PRIMARY KEY,
  reference_id TEXT NOT NULL,
  reference_type TEXT DEFAULT 'chat',
  sender_user_id TEXT NOT NULL,
  receiver_user_id TEXT NOT NULL,
  message_text TEXT,
  reference_list TEXT,  -- JSON array of ChatReferenceItem
  read_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  changed_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_hazo_chat_reference_id ON hazo_chat(reference_id);
CREATE INDEX idx_hazo_chat_sender ON hazo_chat(sender_user_id);
CREATE INDEX idx_hazo_chat_receiver ON hazo_chat(receiver_user_id);
CREATE INDEX idx_hazo_chat_created ON hazo_chat(created_at);
```

## Configuration

### hazo_chat_config.ini (Optional)

```ini
[chat]
# Polling interval in milliseconds
polling_interval = 5000

# Messages to load per page
messages_per_page = 20

[uploads]
# Maximum file size in MB
max_file_size_mb = 10

# Allowed file extensions (comma-separated)
allowed_types = pdf,png,jpg,jpeg,gif,txt,doc,docx
```

## Migration from v1.x

Version 2.0 introduces breaking changes for a simpler, more reliable architecture.

### What Changed

| v1.x | v2.x |
|------|------|
| Pass `hazo_connect` prop | Not needed - uses API calls |
| Pass `hazo_auth` prop | Not needed - uses API calls |
| Pass `document_save_location` prop | Not needed |
| Direct database access | API-based data access |

### Migration Steps

1. **Remove adapter props:**

```tsx
// Before (v1.x)
<HazoChat
  hazo_connect={adapter}
  hazo_auth={authService}
  document_save_location="/uploads"
  receiver_user_id="..."
/>

// After (v2.x)
<HazoChat
  receiver_user_id="..."
/>
```

2. **Create API routes** (see [API Routes Setup](#api-routes-setup))

3. **Update imports:**

```typescript
// The API handler factory is new
import { createMessagesHandler } from 'hazo_chat/api';
```

### Why the Change?

The v1.x architecture required passing server-side adapters (`hazo_connect`, `hazo_auth`) to client components. This caused issues:

- "Module not found: Can't resolve 'fs'" errors
- Hydration mismatches
- Complex webpack configuration

The v2.x API-first architecture solves these by keeping all server code in API routes.

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
import { createMessagesHandler } from 'hazo_chat/api';

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

## Related Packages

- [hazo_connect](https://github.com/pub12/hazo_connect) - Database adapter
- [hazo_auth](https://github.com/pub12/hazo_auth) - Authentication service
- [hazo_config](https://github.com/pub12/hazo_config) - Configuration management

## License

MIT © Pubs Abayasiri

---

For detailed setup instructions, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md).
