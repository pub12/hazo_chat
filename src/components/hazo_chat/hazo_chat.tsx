/**
 * HazoChat Component
 * 
 * Main chat UI component with:
 * - Responsive grid layout (sidebar + chat area)
 * - Context provider for shared state
 * - Integration with hazo_connect, hazo_auth
 * - Document viewer and reference list
 * - Message polling and pagination
 */

'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { cn } from '../../lib/utils.js';
import type {
  HazoChatProps,
  ChatReferenceItem,
  CreateMessagePayload,
  UploadedFile
} from '../../types/index.js';
import {
  DEFAULT_TIMEZONE,
  DEFAULT_POLLING_INTERVAL,
  DEFAULT_MESSAGES_PER_PAGE
} from '../../lib/constants.js';

// Sub-components
import { HazoChatProvider, useHazoChatContext } from './hazo_chat_context.js';
import { HazoChatHeader } from './hazo_chat_header.js';
import { HazoChatSidebar } from './hazo_chat_sidebar.js';
import { HazoChatReferenceList } from './hazo_chat_reference_list.js';
import { HazoChatDocumentViewer } from './hazo_chat_document_viewer.js';
import { HazoChatMessages } from './hazo_chat_messages.js';
import { HazoChatInput } from './hazo_chat_input.js';
import { TooltipProvider } from '../ui/tooltip.js';

// Hooks
import { useChatMessages } from '../../hooks/use_chat_messages.js';
import { useChatReferences } from '../../hooks/use_chat_references.js';
import { useFileUpload } from '../../hooks/use_file_upload.js';

// ============================================================================
// Inner Component (uses context)
// ============================================================================

interface HazoChatInnerProps extends Omit<HazoChatProps, 'hazo_auth'> {
  polling_interval?: number;
  messages_per_page?: number;
}

function HazoChatInner({
  hazo_connect,
  receiver_user_id,
  document_save_location,
  reference_id,
  reference_type = 'chat',
  additional_references = [],
  timezone = DEFAULT_TIMEZONE,
  title,
  subtitle,
  on_close,
  className,
  polling_interval = DEFAULT_POLLING_INTERVAL,
  messages_per_page = DEFAULT_MESSAGES_PER_PAGE
}: HazoChatInnerProps) {
  // Get context
  const {
    current_user,
    selected_reference,
    highlighted_message_id,
    pending_attachments,
    is_sidebar_open,
    set_selected_reference,
    set_highlighted_message_id,
    add_pending_attachment,
    remove_pending_attachment,
    clear_pending_attachments,
    toggle_sidebar,
    set_sidebar_open,
    add_reference
  } = useHazoChatContext();

  // -------------------------------------------------------------------------
  // Messages hook
  // -------------------------------------------------------------------------
  const {
    messages,
    is_loading: is_loading_messages,
    has_more,
    load_more,
    send_message,
    delete_message,
    polling_status
  } = useChatMessages({
    hazo_connect,
    hazo_auth: { hazo_get_auth: async () => current_user ? { id: current_user.id } : null, hazo_get_user_profiles: async () => [] },
    reference_id,
    receiver_user_id,
    polling_interval,
    messages_per_page
  });

  // -------------------------------------------------------------------------
  // References hook
  // -------------------------------------------------------------------------
  const {
    references,
    select_reference,
    get_message_for_reference
  } = useChatReferences({
    messages,
    initial_references: additional_references.map((ref) => ({
      ...ref,
      scope: ref.scope || 'field'
    })),
    on_selection_change: (ref) => {
      set_selected_reference(ref);
      // If ref has message_id, highlight it
      if (ref?.message_id) {
        set_highlighted_message_id(ref.message_id);
        // Close sidebar on mobile after selection
        set_sidebar_open(false);
      }
    }
  });

  // -------------------------------------------------------------------------
  // File upload hook
  // -------------------------------------------------------------------------
  const {
    add_files,
    remove_file,
    upload_all,
    is_uploading
  } = useFileUpload({
    upload_location: document_save_location
  });

  // -------------------------------------------------------------------------
  // Handle send message
  // -------------------------------------------------------------------------
  const handle_send = useCallback(
    async (text: string, attachments: UploadedFile[]) => {
      if (!current_user || !reference_id) return;

      // Upload pending files first
      const uploaded = await upload_all();

      // Build reference list from attachments
      const attachment_refs: ChatReferenceItem[] = [
        ...attachments,
        ...uploaded
      ].map((file) => ({
        id: file.id,
        type: 'document' as const,
        scope: 'chat' as const,
        name: file.name,
        url: file.url,
        mime_type: file.mime_type,
        file_size: file.file_size
      }));

      const payload: CreateMessagePayload = {
        reference_id,
        reference_type,
        receiver_user_id,
        message_text: text,
        reference_list: attachment_refs.length > 0 ? attachment_refs : undefined
      };

      const success = await send_message(payload);

      if (success) {
        clear_pending_attachments();
        // Add new references to the list
        attachment_refs.forEach((ref) => add_reference(ref));
      }
    },
    [
      current_user,
      reference_id,
      reference_type,
      receiver_user_id,
      upload_all,
      send_message,
      clear_pending_attachments,
      add_reference
    ]
  );

  // -------------------------------------------------------------------------
  // Handle add attachment
  // -------------------------------------------------------------------------
  const handle_add_attachment = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        add_pending_attachment(file);
      });
      add_files(files);
    },
    [add_pending_attachment, add_files]
  );

  // -------------------------------------------------------------------------
  // Handle remove attachment
  // -------------------------------------------------------------------------
  const handle_remove_attachment = useCallback(
    (attachment_id: string) => {
      remove_pending_attachment(attachment_id);
      remove_file(attachment_id);
    },
    [remove_pending_attachment, remove_file]
  );

  // -------------------------------------------------------------------------
  // Handle reference selection
  // -------------------------------------------------------------------------
  const handle_reference_select = useCallback(
    (reference: ChatReferenceItem) => {
      select_reference(reference);
    },
    [select_reference]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      className={cn(
        'cls_hazo_chat',
        'flex flex-col h-full w-full',
        'bg-background rounded-lg border overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <HazoChatHeader
        title={title}
        subtitle={subtitle}
        on_close={on_close}
        on_toggle_sidebar={toggle_sidebar}
        is_sidebar_open={is_sidebar_open}
      />

      {/* Main content area */}
      <div className="cls_chat_main flex flex-1 overflow-hidden relative">
        {/* Sidebar (references + viewer) */}
        <HazoChatSidebar
          is_open={is_sidebar_open}
          on_close={() => set_sidebar_open(false)}
          className="md:w-[280px] md:flex-shrink-0"
        >
          {/* Reference list */}
          <div className="cls_sidebar_references border-b p-2">
            <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
              References
            </h3>
            <HazoChatReferenceList
              references={references}
              selected_reference_id={selected_reference?.id}
              on_select={handle_reference_select}
            />
          </div>

          {/* Document viewer */}
          <div className="cls_sidebar_viewer flex-1 min-h-0">
            <HazoChatDocumentViewer reference={selected_reference || undefined} />
          </div>
        </HazoChatSidebar>

        {/* Chat area */}
        <div className="cls_chat_area flex flex-col flex-1 min-w-0">
          {/* Messages */}
          <HazoChatMessages
            messages={messages}
            current_user_id={current_user?.id || ''}
            timezone={timezone}
            is_loading={is_loading_messages}
            has_more={has_more}
            on_load_more={load_more}
            on_delete_message={delete_message}
            highlighted_message_id={highlighted_message_id || undefined}
          />

          {/* Input */}
          <HazoChatInput
            on_send={handle_send}
            pending_attachments={pending_attachments}
            on_add_attachment={handle_add_attachment}
            on_remove_attachment={handle_remove_attachment}
            is_disabled={!current_user || is_uploading}
          />
        </div>
      </div>

      {/* Connection status indicator */}
      {polling_status !== 'connected' && (
        <div
          className={cn(
            'cls_connection_status',
            'absolute bottom-20 left-1/2 -translate-x-1/2',
            'px-3 py-1.5 rounded-full text-xs font-medium',
            polling_status === 'reconnecting'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {polling_status === 'reconnecting' ? 'Reconnecting...' : 'Connection error'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component (with Provider)
// ============================================================================

export function HazoChat(props: HazoChatProps) {
  const {
    hazo_auth,
    additional_references = [],
    ...inner_props
  } = props;

  // Convert ReferenceItem[] to ChatReferenceItem[]
  const initial_refs: ChatReferenceItem[] = useMemo(
    () =>
      additional_references.map((ref) => ({
        ...ref,
        scope: ref.scope || 'field'
      })),
    [additional_references]
  );

  return (
    <TooltipProvider>
      <HazoChatProvider
        hazo_auth={hazo_auth}
        initial_references={initial_refs}
      >
        <HazoChatInner
          {...inner_props}
          additional_references={additional_references}
        />
      </HazoChatProvider>
    </TooltipProvider>
  );
}

HazoChat.displayName = 'HazoChat';

