# hazo_chat

A full-featured React chat component library for 1-1 communication with document sharing, file attachments, and real-time messaging capabilities.

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

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Main Component](#main-component)
- [Props Reference](#props-reference)
- [Hooks](#hooks)
- [Types](#types)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Development](#development)
- [License](#license)

## Installation

```bash
npm install hazo_chat hazo_connect hazo_auth
```

## Quick Start

```tsx
'use client';

import { HazoChat } from 'hazo_chat';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

// Create hazo_auth service wrapper
const hazo_auth = {
  hazo_get_auth: async () => {
    const response = await fetch('/api/hazo_auth/me');
    const data = await response.json();
    return data.is_authenticated ? { id: data.user_id, email: data.email } : null;
  },
  hazo_get_user_profiles: async (user_ids: string[]) => {
    const response = await fetch('/api/hazo_auth/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids }),
    });
    const data = await response.json();
    return data.profiles;
  },
};

function ChatPage() {
  const hazo_connect = getHazoConnectSingleton();
  
  return (
    <HazoChat
      hazo_connect={hazo_connect}
      hazo_auth={hazo_auth}
      receiver_user_id="recipient-uuid"
      document_save_location="/uploads/chat"
      reference_id="conversation-123"
      reference_type="support"
      title="Chat with Support"
      subtitle="We're here to help"
    />
  );
}
```

## Prerequisites

### Peer Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `hazo_connect` | ^2.3.1 | Database adapter (required) |
| `hazo_auth` | ^1.0.0 | Authentication service (required) |
| `react` | ^18.0.0 | React framework |
| `react-dom` | ^18.0.0 | React DOM |

### Required Setup

1. **Database** - SQLite or PostgreSQL with the `hazo_chat` table
2. **Authentication** - Working hazo_auth setup with user management
3. **API Routes** - Backend endpoints for chat operations
4. **Configuration Files** - hazo_connect_config.ini for database connection

See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for detailed setup instructions.

## Main Component

### HazoChat

The primary component that provides a complete chat interface.

```tsx
import { HazoChat } from 'hazo_chat';

<HazoChat
  hazo_connect={adapter}
  hazo_auth={authService}
  receiver_user_id="user-123"
  document_save_location="/uploads"
  reference_id="project-456"
  reference_type="project_chat"
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

## Props Reference

### HazoChatProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `hazo_connect` | `HazoConnectAdapter` | ✅ | - | Database adapter instance |
| `hazo_auth` | `HazoAuthInstance` | ✅ | - | Authentication service |
| `receiver_user_id` | `string` | ✅ | - | UUID of the chat recipient |
| `document_save_location` | `string` | ✅ | - | Path for uploaded documents |
| `reference_id` | `string` | ❌ | - | Main reference ID for the chat |
| `reference_type` | `string` | ❌ | `'chat'` | Type of reference |
| `additional_references` | `ReferenceItem[]` | ❌ | `[]` | Pre-loaded document references |
| `timezone` | `string` | ❌ | `'GMT+10'` | Timezone for timestamps |
| `title` | `string` | ❌ | - | Chat header title |
| `subtitle` | `string` | ❌ | - | Chat header subtitle |
| `on_close` | `() => void` | ❌ | - | Close button callback |
| `className` | `string` | ❌ | - | Additional CSS classes |

### HazoAuthInstance

The authentication service must implement these methods:

```typescript
interface HazoAuthInstance {
  /** Get current authenticated user */
  hazo_get_auth: () => Promise<{ id: string; email?: string } | null>;
  
  /** Get user profiles by IDs */
  hazo_get_user_profiles: (user_ids: string[]) => Promise<HazoUserProfile[]>;
}

interface HazoUserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
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
  hazo_connect,
  hazo_auth,
  reference_id: 'chat-123',
  receiver_user_id: 'user-456',
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
  upload_location: '/uploads/chat',
  max_file_size_mb: 10,                  // Optional, default: 10
  allowed_types: ['pdf', 'png', 'jpg'],  // Optional
  upload_function: customUploader,        // Optional custom uploader
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

### CreateMessagePayload

```typescript
interface CreateMessagePayload {
  reference_id: string;
  reference_type: string;
  receiver_user_id: string;
  message_text: string;
  reference_list?: ChatReferenceItem[];
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
  changed_at TEXT NOT NULL,
  
  -- Foreign keys (if using referential integrity)
  FOREIGN KEY (sender_user_id) REFERENCES hazo_users(id),
  FOREIGN KEY (receiver_user_id) REFERENCES hazo_users(id)
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

### Default Values

| Setting | Default | Description |
|---------|---------|-------------|
| `polling_interval` | 5000ms | How often to check for new messages |
| `messages_per_page` | 20 | Messages loaded per pagination request |
| `max_file_size_mb` | 10 | Maximum upload file size |
| `timezone` | 'GMT+10' | Default timezone for timestamps |

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

### Project Structure

```
hazo_chat/
├── src/
│   ├── components/
│   │   ├── hazo_chat/        # Main chat components
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # React hooks
│   ├── lib/                  # Utilities and constants
│   └── types/                # TypeScript definitions
├── test-app/                 # Next.js test application
├── dist/                     # Compiled output (git-ignored)
└── package.json
```

### Package Exports

```typescript
// Main export
import { HazoChat, useChatMessages, useChatReferences, useFileUpload } from 'hazo_chat';

// Components only
import { HazoChat, ChatBubble, ChatInput } from 'hazo_chat/components';

// Library utilities
import { DEFAULT_POLLING_INTERVAL, MIME_TYPE_MAP } from 'hazo_chat/lib';
```

## Troubleshooting

### Common Issues

1. **"hazo_connect.from is not a function"**
   - Ensure you're using `getHazoConnectSingleton()` from `hazo_connect/nextjs/setup`
   - The adapter must be the HazoConnectAdapter type, not a raw connection

2. **Hydration errors**
   - Wrap client components in Suspense boundaries
   - Use `mounted` state to delay client-side rendering

3. **Module not found errors**
   - Add transpilePackages in next.config.js: `['hazo_chat', 'hazo_connect', 'hazo_auth']`
   - Check webpack aliases for hazo_auth imports

4. **Messages not loading**
   - Verify database connection in hazo_connect_config.ini
   - Check API route `/api/hazo_chat/messages` exists and works
   - Ensure `reference_id` is provided to the component

## Related Packages

- [hazo_connect](https://github.com/pub12/hazo_connect) - Database adapter
- [hazo_auth](https://github.com/pub12/hazo_auth) - Authentication service
- [hazo_config](https://github.com/pub12/hazo_config) - Configuration management

## License

MIT © Pubs Abayasiri

---

For detailed setup instructions, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md).
