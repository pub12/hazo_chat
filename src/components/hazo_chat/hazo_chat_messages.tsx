/**
 * HazoChatMessages Component
 *
 * Scrollable message list with:
 * - Infinite scroll for older messages
 * - Auto-scroll to new messages
 * - Scroll to highlighted message
 * - Empty and loading states
 * - Memoization for performance
 *
 * Uses shadcn/ui ScrollArea component.
 */

'use client';

import React, { useRef, useEffect, useCallback, memo } from 'react';
import { cn } from '../../lib/utils.js';
import type { HazoChatMessagesProps, ChatReferenceItem, ChatMessage } from '../../types/index.js';
import { ChatBubble } from '../ui/chat_bubble.js';
import { LoadingSkeleton } from '../ui/loading_skeleton.js';
import { ScrollArea } from '../ui/scroll-area.js';
import { EMPTY_CHAT_MESSAGE } from '../../lib/constants.js';

// ============================================================================
// Memoized ChatBubble wrapper for better performance
// ============================================================================

interface MemoizedChatBubbleProps {
  message: ChatMessage;
  current_user_id: string;
  timezone: string;
  on_delete_message: (message_id: string) => void;
  on_reference_click: (reference: ChatReferenceItem) => void;
  is_highlighted: boolean;
  show_delete_button: boolean;
  bubble_radius: 'default' | 'full';
  hide_preview: boolean;
}

const MemoizedChatBubble = memo(
  function MemoizedChatBubble({
    message,
    current_user_id,
    timezone,
    on_delete_message,
    on_reference_click,
    is_highlighted,
    show_delete_button,
    bubble_radius,
    hide_preview,
  }: MemoizedChatBubbleProps) {
    const is_sender = message.sender_user_id === current_user_id;

    return (
      <ChatBubble
        message={message}
        is_sender={is_sender}
        sender_profile={message.sender_profile}
        timezone={timezone}
        on_delete={is_sender ? () => on_delete_message(message.id) : undefined}
        on_reference_click={on_reference_click}
        is_highlighted={is_highlighted}
        show_delete_button={show_delete_button}
        bubble_radius={bubble_radius}
        hide_preview={hide_preview}
      />
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.read_at === nextProps.message.read_at &&
      prevProps.message.deleted_at === nextProps.message.deleted_at &&
      prevProps.message.send_status === nextProps.message.send_status &&
      prevProps.is_highlighted === nextProps.is_highlighted &&
      prevProps.show_delete_button === nextProps.show_delete_button &&
      prevProps.bubble_radius === nextProps.bubble_radius &&
      prevProps.hide_preview === nextProps.hide_preview
    );
  }
);

// ============================================================================
// Component
// ============================================================================

function HazoChatMessagesInner({
  messages,
  current_user_id,
  timezone,
  is_loading,
  has_more,
  on_load_more,
  on_delete_message,
  on_mark_as_read,
  on_scroll_to_message,
  highlighted_message_id,
  show_delete_button = true,
  bubble_radius = 'default',
  hide_preview = false,
  className
}: HazoChatMessagesProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const load_more_trigger_ref = useRef<HTMLDivElement>(null);
  const is_at_bottom_ref = useRef(true);
  const previous_messages_length_ref = useRef(0);
  const message_refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const marked_as_read_ref = useRef<Set<string>>(new Set());

  // -------------------------------------------------------------------------
  // Intersection observer for infinite scroll
  // -------------------------------------------------------------------------
  useEffect(() => {
    const trigger = load_more_trigger_ref.current;
    if (!trigger || !has_more) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          on_load_more();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [has_more, on_load_more]);

  // -------------------------------------------------------------------------
  // Track scroll position
  // -------------------------------------------------------------------------
  const handle_scroll = useCallback(() => {
    const container = container_ref.current;
    if (!container) return;

    // Check if scrolled to bottom
    const threshold = 50;
    is_at_bottom_ref.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // -------------------------------------------------------------------------
  // Auto-scroll to bottom on new messages (if already at bottom)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const container = container_ref.current;
    if (!container) return;

    // On initial load, scroll to bottom (newest message)
    if (previous_messages_length_ref.current === 0 && messages.length > 0) {
      // Initial load - scroll to bottom after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (container_ref.current) {
          container_ref.current.scrollTop = container_ref.current.scrollHeight;
        }
      }, 100);
    }
    // Only auto-scroll if we were at the bottom and new messages arrived
    else if (is_at_bottom_ref.current && messages.length > previous_messages_length_ref.current) {
      container.scrollTop = container.scrollHeight;
    }

    previous_messages_length_ref.current = messages.length;
  }, [messages.length]);

  // -------------------------------------------------------------------------
  // Scroll to highlighted message
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!highlighted_message_id) return;

    const element = document.getElementById(`message-${highlighted_message_id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted_message_id]);

  // -------------------------------------------------------------------------
  // Handle reference click in message
  // -------------------------------------------------------------------------
  const handle_reference_click = useCallback((_reference: ChatReferenceItem) => {
    // This would be handled by parent via context
  }, []);

  // -------------------------------------------------------------------------
  // Auto-mark messages as read when they become visible
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!on_mark_as_read) {
      return;
    }

    // Filter to only unread messages not sent by current user
    // In group chat, any message not sent by the current user can be marked as read
    const unread_messages = messages.filter(
      (msg) =>
        msg.sender_user_id !== current_user_id &&
        !msg.read_at &&
        !marked_as_read_ref.current.has(msg.id)
    );

    if (unread_messages.length === 0) return;

    // Find the ScrollArea viewport (the actual scrolling container)
    // Radix UI ScrollArea creates a viewport element with data attribute
    const scroll_viewport = container_ref.current?.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    const root = scroll_viewport || null;

    // Create intersection observer for each unread message
    const observers: IntersectionObserver[] = [];

    // Use a small delay to ensure refs are set after render
    const timeout_id = setTimeout(() => {
      unread_messages.forEach((message) => {
        const element = message_refs.current.get(message.id);
        if (!element) {
          return;
        }

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                // Message is at least 50% visible, mark as read
                if (!marked_as_read_ref.current.has(message.id)) {
                  marked_as_read_ref.current.add(message.id);
                  on_mark_as_read(message.id);
                  observer.disconnect();
                }
              }
            });
          },
          {
            threshold: 0.5, // Mark as read when 50% visible
            root: root, // Use ScrollArea viewport as root
            rootMargin: '0px',
          }
        );

        observer.observe(element);
        observers.push(observer);
      });
    }, 100); // Small delay to ensure DOM refs are ready

    return () => {
      clearTimeout(timeout_id);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [messages, current_user_id, on_mark_as_read]);

  // -------------------------------------------------------------------------
  // Clean up marked_as_read set when messages change significantly
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Remove IDs from marked_as_read set if message is no longer in messages
    const current_message_ids = new Set(messages.map((m) => m.id));
    marked_as_read_ref.current.forEach((id) => {
      if (!current_message_ids.has(id)) {
        marked_as_read_ref.current.delete(id);
      }
    });
  }, [messages]);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (is_loading && messages.length === 0) {
    return (
      <div className={cn('cls_messages_loading p-4', className)}>
        <LoadingSkeleton variant="message" count={5} />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  if (!is_loading && messages.length === 0) {
    return (
      <div
        className={cn(
          'cls_messages_empty',
          'flex items-center justify-center h-full',
          'px-6 py-8',
          'text-muted-foreground text-sm',
          className
        )}
      >
        {EMPTY_CHAT_MESSAGE}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Messages list
  // -------------------------------------------------------------------------
  return (
    <ScrollArea className={cn('cls_hazo_chat_messages flex-1', className)}>
      <div
        ref={container_ref}
        onScroll={handle_scroll}
        className={cn(
          'cls_messages_container',
          'p-4',
          'flex flex-col' // Normal order: oldest first, newest last (at bottom)
        )}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Load more trigger - at top for loading older messages */}
        {has_more && (
          <div
            ref={load_more_trigger_ref}
            className="cls_load_more_trigger py-4"
          >
            <LoadingSkeleton variant="message" count={2} />
          </div>
        )}

        {/* Messages (in chronological order: oldest first, newest last) */}
        {messages.map((message) => (
          <div
            key={message.id}
            id={`message-${message.id}`}
            ref={(el) => {
              if (el) {
                message_refs.current.set(message.id, el);
              } else {
                message_refs.current.delete(message.id);
              }
            }}
          >
            <MemoizedChatBubble
              message={message}
              current_user_id={current_user_id}
              timezone={timezone}
              on_delete_message={on_delete_message}
              on_reference_click={handle_reference_click}
              is_highlighted={highlighted_message_id === message.id}
              show_delete_button={show_delete_button}
              bubble_radius={bubble_radius}
              hide_preview={hide_preview}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Memoized export to prevent unnecessary re-renders
export const HazoChatMessages = memo(HazoChatMessagesInner, (prevProps, nextProps) => {
  // Deep comparison for messages array by checking length and IDs
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (prevProps.is_loading !== nextProps.is_loading) return false;
  if (prevProps.has_more !== nextProps.has_more) return false;
  if (prevProps.highlighted_message_id !== nextProps.highlighted_message_id) return false;
  if (prevProps.show_delete_button !== nextProps.show_delete_button) return false;
  if (prevProps.bubble_radius !== nextProps.bubble_radius) return false;
  if (prevProps.hide_preview !== nextProps.hide_preview) return false;

  // Check if any message has changed (by comparing key fields)
  for (let i = 0; i < prevProps.messages.length; i++) {
    const prev = prevProps.messages[i];
    const next = nextProps.messages[i];
    if (
      prev.id !== next.id ||
      prev.read_at !== next.read_at ||
      prev.deleted_at !== next.deleted_at ||
      prev.send_status !== next.send_status
    ) {
      return false;
    }
  }

  return true;
});

HazoChatMessages.displayName = 'HazoChatMessages';
