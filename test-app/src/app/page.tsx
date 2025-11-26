/**
 * Home Page - Test App
 * 
 * Demonstrates the HazoChat component with mock services.
 */

'use client';

import { useState, useCallback } from 'react';
import { HazoChat } from 'hazo_chat';
import type {
  HazoConnectInstance,
  HazoConnectQueryBuilder,
  HazoConnectResponse,
  HazoAuthInstance,
  HazoUserProfile,
  ChatMessageDB,
  ReferenceItem
} from 'hazo_chat';
import { Button } from '@/components/ui/button';

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_CURRENT_USER: HazoUserProfile = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
};

const MOCK_OTHER_USER: HazoUserProfile = {
  id: 'user-2',
  name: 'Sarah Chen',
  email: 'sarah@example.com',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
};

const MOCK_MESSAGES: ChatMessageDB[] = [
  {
    id: 'msg-1',
    reference_id: 'ref-123',
    reference_type: 'chat',
    sender_user_id: 'user-2',
    receiver_user_id: 'user-1',
    message_text: 'Hey! Welcome to the hazo_chat demo. This component supports file attachments, document viewing, and real-time messaging.',
    reference_list: null,
    read_at: new Date(Date.now() - 3500000).toISOString(),
    deleted_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    changed_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg-2',
    reference_id: 'ref-123',
    reference_type: 'chat',
    sender_user_id: 'user-1',
    receiver_user_id: 'user-2',
    message_text: 'Thanks! The interface looks really clean. I especially like the document viewer on the side.',
    reference_list: null,
    read_at: new Date(Date.now() - 3400000).toISOString(),
    deleted_at: null,
    created_at: new Date(Date.now() - 3500000).toISOString(),
    changed_at: new Date(Date.now() - 3500000).toISOString()
  },
  {
    id: 'msg-3',
    reference_id: 'ref-123',
    reference_type: 'chat',
    sender_user_id: 'user-2',
    receiver_user_id: 'user-1',
    message_text: 'Here is a sample document I wanted to share with you.',
    reference_list: [
      {
        id: 'doc-1',
        type: 'document',
        scope: 'chat',
        name: 'Sample Report.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        mime_type: 'application/pdf'
      }
    ],
    read_at: null,
    deleted_at: null,
    created_at: new Date(Date.now() - 3400000).toISOString(),
    changed_at: new Date(Date.now() - 3400000).toISOString()
  }
];

const MOCK_REFERENCES: ReferenceItem[] = [
  {
    id: 'ref-field-1',
    type: 'field',
    scope: 'field',
    name: 'Project Name',
    url: '#field-project-name'
  },
  {
    id: 'ref-url-1',
    type: 'url',
    scope: 'field',
    name: 'Documentation',
    url: 'https://github.com/pub12/hazo_chat'
  }
];

// ============================================================================
// Mock Services
// ============================================================================

/**
 * Create mock hazo_connect instance
 */
function create_mock_hazo_connect(messages: ChatMessageDB[]): HazoConnectInstance {
  return {
    from: (table: string) => create_mock_query_builder(table, messages)
  };
}

/**
 * Create mock query builder
 */
function create_mock_query_builder(table: string, messages: ChatMessageDB[]) {
  let filtered_messages = [...messages];
  let insert_data: Record<string, unknown> | null = null;

  const builder: HazoConnectQueryBuilder = {
    select: () => builder,
    insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
      insert_data = Array.isArray(data) ? data[0] : data;
      return builder;
    },
    update: () => builder,
    delete: () => builder,
    eq: (column: string, value: unknown) => {
      if (column === 'reference_id') {
        filtered_messages = filtered_messages.filter(m => m.reference_id === value);
      }
      return builder;
    },
    neq: () => builder,
    gt: (column: string, value: unknown) => {
      if (column === 'created_at') {
        filtered_messages = filtered_messages.filter(m => new Date(m.created_at) > new Date(value as string));
      }
      return builder;
    },
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    or: () => builder,
    order: (column: string, options?: { ascending?: boolean }) => {
      filtered_messages.sort((a, b) => {
        const a_val = a[column as keyof ChatMessageDB] as string;
        const b_val = b[column as keyof ChatMessageDB] as string;
        return options?.ascending 
          ? a_val.localeCompare(b_val)
          : b_val.localeCompare(a_val);
      });
      return builder;
    },
    range: (from: number, to: number) => {
      filtered_messages = filtered_messages.slice(from, to + 1);
      return builder;
    },
    single: async () => {
      if (insert_data) {
        const new_message: ChatMessageDB = {
          id: `msg-${Date.now()}`,
          reference_id: insert_data.reference_id as string,
          reference_type: insert_data.reference_type as string,
          sender_user_id: insert_data.sender_user_id as string,
          receiver_user_id: insert_data.receiver_user_id as string,
          message_text: insert_data.message_text as string,
          reference_list: insert_data.reference_list as ChatMessageDB['reference_list'],
          read_at: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          changed_at: new Date().toISOString()
        };
        messages.push(new_message);
        return { data: new_message, error: null };
      }
      return { data: filtered_messages[0] || null, error: null };
    },
    then: async <T,>(resolve: (response: HazoConnectResponse<T>) => void) => {
      resolve({ data: filtered_messages as T, error: null });
    }
  };

  return builder;
}

/**
 * Create mock hazo_auth instance
 */
function create_mock_hazo_auth(): HazoAuthInstance {
  return {
    hazo_get_auth: async () => ({ id: MOCK_CURRENT_USER.id, email: MOCK_CURRENT_USER.email }),
    hazo_get_user_profiles: async (user_ids: string[]) => {
      const profiles: HazoUserProfile[] = [];
      user_ids.forEach(id => {
        if (id === MOCK_CURRENT_USER.id) profiles.push(MOCK_CURRENT_USER);
        if (id === MOCK_OTHER_USER.id) profiles.push(MOCK_OTHER_USER);
      });
      return profiles;
    }
  };
}

// ============================================================================
// Component
// ============================================================================

export default function HomePage() {
  const [is_chat_open, set_is_chat_open] = useState(true);
  const [messages] = useState(MOCK_MESSAGES);

  const mock_hazo_connect = create_mock_hazo_connect(messages);
  const mock_hazo_auth = create_mock_hazo_auth();

  const handle_close = useCallback(() => {
    set_is_chat_open(false);
  }, []);

  const handle_open = useCallback(() => {
    set_is_chat_open(true);
  }, []);

  return (
    <main className="cls_home_page min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="cls_content container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="cls_header mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            hazo_chat
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            A powerful chat component with document viewing and real-time messaging
          </p>
        </header>

        {/* Chat Toggle Button */}
        {!is_chat_open && (
          <div className="cls_chat_toggle fixed bottom-6 right-6">
            <Button
              onClick={handle_open}
              size="lg"
              className="rounded-full shadow-lg"
            >
              Open Chat
            </Button>
          </div>
        )}

        {/* Chat Component */}
        {is_chat_open && (
          <div className="cls_chat_container h-[700px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <HazoChat
              hazo_connect={mock_hazo_connect}
              hazo_auth={mock_hazo_auth}
              receiver_user_id={MOCK_OTHER_USER.id}
              document_save_location="/uploads"
              reference_id="ref-123"
              reference_type="chat"
              additional_references={MOCK_REFERENCES}
              timezone="Australia/Sydney"
              title="Chat with Sarah"
              subtitle="Project Discussion"
              on_close={handle_close}
            />
          </div>
        )}

        {/* Features Grid */}
        <section className="cls_features mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Document Viewer"
            description="View PDFs, images, and text files directly in the sidebar. Supports drag-and-drop uploads."
          />
          <FeatureCard
            title="Real-time Messaging"
            description="Polling-based message updates with configurable intervals. Optimistic UI for instant feedback."
          />
          <FeatureCard
            title="Responsive Design"
            description="Collapsible sidebar on mobile. Grid layout on desktop. Works in sheets and dialogs."
          />
        </section>
      </div>
    </main>
  );
}

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="cls_feature_card p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm">
        {description}
      </p>
    </div>
  );
}
