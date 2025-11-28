/**
 * HazoChat Component
 * 
 * Main chat UI component with:
 * - Responsive grid layout (sidebar + chat area)
 * - Context provider for shared state
 * - Document viewer and reference list
 * - Message polling and pagination
 * 
 * Uses API calls internally - no server-side dependencies required.
 */

'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { IoChevronDown, IoChevronUp, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type {
  HazoChatProps,
  ChatReferenceItem,
  CreateMessagePayload,
  UploadedFile
} from '../../types/index.js';
import {
  DEFAULT_TIMEZONE,
  DEFAULT_REALTIME_MODE,
  DEFAULT_POLLING_INTERVAL,
  DEFAULT_MESSAGES_PER_PAGE
} from '../../lib/constants.js';
import type { RealtimeMode } from '../../types/index.js';

// Sub-components
import { HazoChatProvider, useHazoChatContext } from './hazo_chat_context.js';
import { HazoChatHeader } from './hazo_chat_header.js';
import { HazoChatReferenceList } from './hazo_chat_reference_list.js';
import { HazoChatDocumentViewer } from './hazo_chat_document_viewer.js';
import { HazoChatMessages } from './hazo_chat_messages.js';
import { HazoChatInput } from './hazo_chat_input.js';
import { TooltipProvider } from '../ui/tooltip.js';
import { Button } from '../ui/button.js';

// Hooks
import { useChatMessages } from '../../hooks/use_chat_messages.js';
import { useChatReferences } from '../../hooks/use_chat_references.js';
import { useFileUpload } from '../../hooks/use_file_upload.js';

// ============================================================================
// Inner Component (uses context)
// ============================================================================

interface HazoChatInnerProps {
  receiver_user_id: string;
  reference_id?: string;
  reference_type?: string;
  api_base_url?: string;
  additional_references?: ChatReferenceItem[];
  timezone?: string;
  title?: string;
  subtitle?: string;
  on_close?: () => void;
  className?: string;
  realtime_mode?: RealtimeMode;
  polling_interval?: number;
  messages_per_page?: number;
}

function HazoChatInner({
  receiver_user_id,
  reference_id = '',
  reference_type = 'chat',
  api_base_url = '/api/hazo_chat',
  additional_references = [],
  timezone = DEFAULT_TIMEZONE,
  title,
  subtitle,
  on_close,
  className,
  realtime_mode = DEFAULT_REALTIME_MODE,
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
  // Messages hook (uses API calls)
  // -------------------------------------------------------------------------
  const {
    messages,
    is_loading: is_loading_messages,
    has_more,
    load_more,
    send_message,
    delete_message,
    polling_status,
    refresh: refresh_messages
  } = useChatMessages({
    receiver_user_id,
    reference_id,
    reference_type,
    api_base_url,
    realtime_mode,
    polling_interval,
    messages_per_page
  });

  // -------------------------------------------------------------------------
  // References hook
  // -------------------------------------------------------------------------
  const {
    references,
    select_reference
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
  // References section collapse state
  // -------------------------------------------------------------------------
  const [is_references_expanded, set_is_references_expanded] = useState(() => {
    // Default to collapsed if no references
    return references.length > 0;
  });

  // Auto-expand when references are added
  useEffect(() => {
    if (references.length > 0 && !is_references_expanded) {
      set_is_references_expanded(true);
    }
  }, [references.length, is_references_expanded]);

  // -------------------------------------------------------------------------
  // Document viewer collapse state
  // -------------------------------------------------------------------------
  const [is_document_viewer_expanded, set_is_document_viewer_expanded] = useState(true);

  // -------------------------------------------------------------------------
  // File upload hook
  // -------------------------------------------------------------------------
  const {
    add_files,
    remove_file,
    upload_all,
    is_uploading
  } = useFileUpload({
    upload_location: `${api_base_url}/uploads`
  });

  // -------------------------------------------------------------------------
  // Handle send message
  // -------------------------------------------------------------------------
  const handle_send = useCallback(
    async (text: string, attachments: UploadedFile[]) => {
      if (!current_user) return;

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
        reference_id: reference_id || '',
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
      {/* Row 1: Header (title area) */}
      <HazoChatHeader
        title={title}
        subtitle={subtitle}
        on_close={on_close}
        on_refresh={refresh_messages}
        is_refreshing={is_loading_messages}
        // Only show hamburger button on mobile for sidebar toggle
        // On desktop, document viewer is always visible, so no toggle needed
        on_toggle_sidebar={toggle_sidebar}
        is_sidebar_open={is_sidebar_open}
      />

      {/* Row 2: Reference area (full width) - collapsible */}
      <div className={cn(
        'cls_references_row border-b bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden',
        is_references_expanded ? 'max-h-96' : 'max-h-8'
      )}>
        <div className="cls_references_container px-3 py-2">
          <button
            onClick={() => set_is_references_expanded(!is_references_expanded)}
            className="cls_references_header flex items-center justify-between w-full gap-2 mb-1.5 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
            aria-label={is_references_expanded ? 'Collapse references' : 'Expand references'}
            aria-expanded={is_references_expanded}
          >
            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              References
            </h3>
            {is_references_expanded ? (
              <IoChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <IoChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {is_references_expanded && (
            <div className="cls_references_content">
              <HazoChatReferenceList
                references={references}
                selected_reference_id={selected_reference?.id}
                on_select={handle_reference_select}
                className="flex-wrap"
              />
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Two columns (doc preview | chat history) */}
      <div className="cls_main_content flex flex-1 overflow-hidden relative">
        {/* Column 1: Document preview - collapsible */}
        <div
          className={cn(
            'cls_doc_preview_column',
            'border-r bg-muted/20',
            'flex-shrink-0 flex flex-col',
            'transition-all duration-300 ease-in-out overflow-hidden',
            // Mobile: hidden by default, shown when sidebar is open
            is_sidebar_open ? 'flex' : 'hidden md:flex',
            // Collapse/expand based on state
            is_document_viewer_expanded
              ? 'w-[280px] md:w-[320px] lg:w-[380px]'
              : 'w-0 border-r-0'
          )}
        >
          {is_document_viewer_expanded && (
            <HazoChatDocumentViewer reference={selected_reference || undefined} />
          )}
        </div>

        {/* Toggle button for document viewer - show on desktop, hide on mobile when sidebar closed */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => set_is_document_viewer_expanded(!is_document_viewer_expanded)}
          className={cn(
            'cls_doc_viewer_toggle',
            'absolute top-1/2 -translate-y-1/2 z-10',
            'h-8 w-6 rounded-r-md rounded-l-none border-l-0',
            'bg-background hover:bg-accent',
            'transition-all duration-300',
            // Hide on mobile when sidebar is closed
            (!is_sidebar_open ? 'hidden md:flex' : 'flex'),
            is_document_viewer_expanded
              ? 'left-[280px] md:left-[320px] lg:left-[380px]'
              : 'left-0'
          )}
          aria-label={is_document_viewer_expanded ? 'Collapse document viewer' : 'Expand document viewer'}
        >
          {is_document_viewer_expanded ? (
            <IoChevronBack className="h-4 w-4" />
          ) : (
            <IoChevronForward className="h-4 w-4" />
          )}
        </Button>

        {/* Column 2: Chat history */}
        <div className="cls_chat_column flex flex-col flex-1 min-w-0">
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
        </div>
      </div>

      {/* Row 4: Chat input (full width) */}
      <div className="cls_input_row border-t bg-background">
        <HazoChatInput
          on_send={handle_send}
          pending_attachments={pending_attachments}
          on_add_attachment={handle_add_attachment}
          on_remove_attachment={handle_remove_attachment}
          is_disabled={!current_user || is_uploading}
        />
      </div>

      {/* Connection status indicator */}
      {polling_status !== 'connected' && (
        <div
          className={cn(
            'cls_connection_status',
            'absolute bottom-20 left-1/2 -translate-x-1/2',
            'px-3 py-1.5 rounded-full text-xs font-medium z-10',
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

/**
 * HazoChat - Main chat component
 * 
 * Uses API calls internally for all data operations.
 * Requires the following API routes to be set up:
 * - GET/POST /api/hazo_chat/messages
 * - GET /api/hazo_auth/me
 * - POST /api/hazo_auth/profiles
 * 
 * See SETUP_CHECKLIST.md for detailed setup instructions.
 */
export function HazoChat(props: HazoChatProps) {
  const {
    receiver_user_id,
    reference_id,
    reference_type = 'chat',
    api_base_url = '/api/hazo_chat',
    additional_references = [],
    timezone = DEFAULT_TIMEZONE,
    title,
    subtitle,
    on_close,
    realtime_mode,
    polling_interval,
    messages_per_page,
    className
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
        api_base_url={api_base_url}
        initial_references={initial_refs}
      >
        <HazoChatInner
          receiver_user_id={receiver_user_id}
          reference_id={reference_id}
          reference_type={reference_type}
          api_base_url={api_base_url}
          additional_references={initial_refs}
          timezone={timezone}
          title={title}
          subtitle={subtitle}
          on_close={on_close}
          realtime_mode={realtime_mode}
          polling_interval={polling_interval}
          messages_per_page={messages_per_page}
          className={className}
        />
      </HazoChatProvider>
    </TooltipProvider>
  );
}

HazoChat.displayName = 'HazoChat';
