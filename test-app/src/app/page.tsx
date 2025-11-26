/**
 * HazoChat Test Page
 * 
 * Demonstrates the hazo_chat component in various containers:
 * - Embedded in a div
 * - In a shadcn Sheet
 * - In a shadcn Dialog
 * 
 * Includes mock data for messages, references, and user profiles.
 */

'use client';

import { useState, useCallback } from 'react';
import { HazoChat } from 'hazo_chat';
import type {
  HazoConnectInstance,
  HazoAuthInstance,
  ChatMessageDB,
  ChatReferenceItem,
  HazoUserProfile,
  ReferenceItem
} from 'hazo_chat';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  IoDocumentAttachSharp, 
  IoChatbubbleEllipses,
  IoExpand,
  IoLayers
} from 'react-icons/io5';

// ============================================================================
// Mock Data
// ============================================================================

// Mock user profiles
const MOCK_USERS: Record<string, HazoUserProfile> = {
  'user-1': {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  },
  'user-2': {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  }
};

// Mock messages
const MOCK_MESSAGES: ChatMessageDB[] = [
  {
    id: 'msg-1',
    reference_id: 'ref-main',
    reference_type: 'project',
    sender_user_id: 'user-2',
    receiver_user_id: 'user-1',
    message_text: 'Hi John! I\'ve uploaded the project requirements document for your review.',
    reference_list: [
      {
        id: 'doc-1',
        type: 'document',
        scope: 'chat',
        name: 'Project_Requirements.pdf',
        url: '/sample-docs/requirements.pdf',
        mime_type: 'application/pdf'
      }
    ],
    read_at: '2024-01-15T10:30:00Z',
    deleted_at: null,
    created_at: '2024-01-15T10:00:00Z',
    changed_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'msg-2',
    reference_id: 'ref-main',
    reference_type: 'project',
    sender_user_id: 'user-1',
    receiver_user_id: 'user-2',
    message_text: 'Thanks Sarah! I\'ll take a look at it this afternoon. The timeline looks good.',
    reference_list: null,
    read_at: '2024-01-15T11:00:00Z',
    deleted_at: null,
    created_at: '2024-01-15T10:45:00Z',
    changed_at: '2024-01-15T10:45:00Z'
  },
  {
    id: 'msg-3',
    reference_id: 'ref-main',
    reference_type: 'project',
    sender_user_id: 'user-2',
    receiver_user_id: 'user-1',
    message_text: 'Great! Also, here\'s the design mockups from the team.',
    reference_list: [
      {
        id: 'doc-2',
        type: 'document',
        scope: 'chat',
        name: 'Design_Mockups.png',
        url: 'https://picsum.photos/800/600',
        mime_type: 'image/png'
      }
    ],
    read_at: null,
    deleted_at: null,
    created_at: '2024-01-15T14:30:00Z',
    changed_at: '2024-01-15T14:30:00Z'
  }
];

// Mock additional references (field references)
const MOCK_ADDITIONAL_REFERENCES: ReferenceItem[] = [
  {
    id: 'field-1',
    type: 'field',
    scope: 'field',
    name: 'Project Budget',
    url: '#field-budget'
  },
  {
    id: 'field-2',
    type: 'url',
    scope: 'field',
    name: 'Figma Design',
    url: 'https://figma.com/file/example'
  },
  {
    id: 'doc-ext-1',
    type: 'document',
    scope: 'field',
    name: 'Contract.pdf',
    url: '/sample-docs/contract.pdf',
    mime_type: 'application/pdf'
  }
];

// ============================================================================
// Mock hazo_connect Implementation
// ============================================================================

function create_mock_hazo_connect(): HazoConnectInstance {
  const messages = [...MOCK_MESSAGES];

  function create_query_builder(table: string) {
    let query_data: unknown[] = [];
    const filters: Array<{ column: string; value: unknown; op: string }> = [];

    const builder = {
      select: () => {
        if (table === 'hazo_chat') {
          query_data = messages.filter(m => !m.deleted_at);
        }
        return builder;
      },
      insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
        if (table === 'hazo_chat') {
          const new_msgs = Array.isArray(data) ? data : [data];
          new_msgs.forEach((msg) => {
            const new_msg: ChatMessageDB = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              reference_id: msg.reference_id as string,
              reference_type: msg.reference_type as string,
              sender_user_id: msg.sender_user_id as string,
              receiver_user_id: msg.receiver_user_id as string,
              message_text: msg.message_text as string | null,
              reference_list: msg.reference_list as ChatReferenceItem[] | null,
              read_at: null,
              deleted_at: null,
              created_at: new Date().toISOString(),
              changed_at: new Date().toISOString()
            };
            messages.push(new_msg);
            query_data = [new_msg];
          });
        }
        return builder;
      },
      update: (data: Record<string, unknown>) => {
        const target_id = filters.find(f => f.column === 'id')?.value;
        if (target_id && table === 'hazo_chat') {
          const idx = messages.findIndex(m => m.id === target_id);
          if (idx !== -1) {
            messages[idx] = { ...messages[idx], ...data, changed_at: new Date().toISOString() } as ChatMessageDB;
            query_data = [messages[idx]];
          }
        }
        return builder;
      },
      delete: () => {
        const target_id = filters.find(f => f.column === 'id')?.value;
        if (target_id && table === 'hazo_chat') {
          const idx = messages.findIndex(m => m.id === target_id);
          if (idx !== -1) {
            messages[idx].deleted_at = new Date().toISOString();
            query_data = [messages[idx]];
          }
        }
        return builder;
      },
      eq: (column: string, value: unknown) => {
        filters.push({ column, value, op: 'eq' });
        if (table === 'hazo_chat') {
          query_data = messages.filter(m => 
            !m.deleted_at && (m as unknown as Record<string, unknown>)[column] === value
          );
        }
        return builder;
      },
      neq: (column: string, value: unknown) => {
        filters.push({ column, value, op: 'neq' });
        query_data = query_data.filter((item) => 
          (item as unknown as Record<string, unknown>)[column] !== value
        );
        return builder;
      },
      gt: (column: string, value: unknown) => {
        filters.push({ column, value, op: 'gt' });
        return builder;
      },
      gte: (column: string, value: unknown) => {
        filters.push({ column, value, op: 'gte' });
        return builder;
      },
      lt: (column: string, value: unknown) => {
        filters.push({ column, value, op: 'lt' });
        return builder;
      },
      lte: (column: string, value: unknown) => {
        filters.push({ column, value, op: 'lte' });
        return builder;
      },
      or: (filter_string: string) => {
        if (table === 'hazo_chat' && filter_string.includes('reference_id')) {
          query_data = messages.filter(m => !m.deleted_at);
        }
        return builder;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        const asc = options?.ascending ?? true;
        query_data = [...query_data].sort((a, b) => {
          const av = (a as unknown as Record<string, unknown>)[column];
          const bv = (b as unknown as Record<string, unknown>)[column];
          if (av === bv) return 0;
          const cmp = av! > bv! ? 1 : -1;
          return asc ? cmp : -cmp;
        });
        return builder;
      },
      range: (from: number, to: number) => {
        query_data = query_data.slice(from, to + 1);
        return builder;
      },
      single: async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { data: query_data[0] || null, error: null };
      },
      then: async function<T>(resolve: (response: { data: T | null; error: null; count?: number }) => void) {
        await new Promise(r => setTimeout(r, 50));
        resolve({ data: query_data as T, error: null, count: query_data.length });
      }
    };

    return builder;
  }

  return {
    from: (table: string) => create_query_builder(table)
  };
}

// ============================================================================
// Mock hazo_auth Implementation
// ============================================================================

function create_mock_hazo_auth(current_user_id: string): HazoAuthInstance {
  return {
    hazo_get_auth: async () => {
      return { id: current_user_id, email: MOCK_USERS[current_user_id]?.email };
    },
    hazo_get_user_profiles: async (user_ids: string[]) => {
      return user_ids
        .map(id => MOCK_USERS[id])
        .filter(Boolean);
    }
  };
}

// ============================================================================
// Page Component
// ============================================================================

export default function HazoChatTestPage() {
  const [is_sheet_open, set_is_sheet_open] = useState(false);
  const [is_dialog_open, set_is_dialog_open] = useState(false);
  const [current_view, set_current_view] = useState<'embedded' | 'sheet' | 'dialog'>('embedded');

  // Create mock instances
  const mock_hazo_connect = create_mock_hazo_connect();
  const mock_hazo_auth = create_mock_hazo_auth('user-1');

  // Common props for HazoChat
  const chat_props = {
    hazo_connect: mock_hazo_connect,
    hazo_auth: mock_hazo_auth,
    receiver_user_id: 'user-2',
    document_save_location: '/uploads/chat',
    reference_id: 'ref-main',
    reference_type: 'project',
    additional_references: MOCK_ADDITIONAL_REFERENCES,
    timezone: 'Australia/Sydney',
    title: 'Chat with Sarah',
    subtitle: 'Project Discussion'
  };

  const handle_close = useCallback(() => {
    set_is_sheet_open(false);
    set_is_dialog_open(false);
    set_current_view('embedded');
  }, []);

  return (
    <main className="cls_test_page min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="cls_page_header border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                hazo_chat
              </h1>
              <p className="text-sm text-muted-foreground">
                Chat component with document viewing and real-time messaging
              </p>
            </div>
            
            {/* View Toggle Buttons */}
            <div className="cls_view_toggles flex items-center gap-2">
              <Button
                variant={current_view === 'embedded' ? 'default' : 'outline'}
                size="sm"
                onClick={() => set_current_view('embedded')}
                className="gap-2"
              >
                <IoLayers className="h-4 w-4" />
                Embedded
              </Button>
              
              <Sheet open={is_sheet_open} onOpenChange={set_is_sheet_open}>
                <SheetTrigger asChild>
                  <Button
                    variant={current_view === 'sheet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set_current_view('sheet')}
                    className="gap-2"
                  >
                    <IoChatbubbleEllipses className="h-4 w-4" />
                    Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-full sm:max-w-xl p-0"
                >
                  <div className="h-full">
                    <HazoChat
                      {...chat_props}
                      on_close={() => set_is_sheet_open(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Dialog open={is_dialog_open} onOpenChange={set_is_dialog_open}>
                <DialogTrigger asChild>
                  <Button
                    variant={current_view === 'dialog' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set_current_view('dialog')}
                    className="gap-2"
                  >
                    <IoExpand className="h-4 w-4" />
                    Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
                  <HazoChat
                    {...chat_props}
                    on_close={() => set_is_dialog_open(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Container - Embedded View */}
          <div className="lg:col-span-2">
            <div className="cls_chat_container bg-white dark:bg-slate-900 rounded-xl shadow-lg border overflow-hidden h-[700px]">
              <HazoChat
                {...chat_props}
                on_close={handle_close}
              />
            </div>
          </div>

          {/* Features Panel */}
          <div className="cls_features_panel space-y-4">
            {/* Reference Types Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <IoDocumentAttachSharp className="h-4 w-4 text-primary" />
                Reference Types
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <code className="text-xs bg-muted px-1 rounded">document</code>
                  - PDF, images, files
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <code className="text-xs bg-muted px-1 rounded">field</code>
                  - Form field references
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <code className="text-xs bg-muted px-1 rounded">url</code>
                  - External links
                </li>
              </ul>
            </div>

            {/* Scope Indicators Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Scope Indicators
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    chat
                  </span>
                  - Document attached in chat
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    field
                  </span>
                  - Field/form reference
                </li>
              </ul>
            </div>

            {/* Message Status Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Message Status
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">✓</span>
                  Sent (grey single check)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓✓</span>
                  Read (green double check)
                </li>
              </ul>
            </div>

            {/* Features List Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Features
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>✓ Grid layout with sidebar</li>
                <li>✓ Document viewer (PDF, images)</li>
                <li>✓ Reference list with icons</li>
                <li>✓ Chat bubbles with avatars</li>
                <li>✓ Timestamps with timezone</li>
                <li>✓ Read receipts</li>
                <li>✓ File drag-and-drop</li>
                <li>✓ Responsive design</li>
                <li>✓ Sheet/Dialog modes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

