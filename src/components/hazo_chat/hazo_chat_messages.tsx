/**
 * HazoChatMessages Component
 * 
 * Scrollable message list with:
 * - Infinite scroll for older messages
 * - Auto-scroll to new messages
 * - Scroll to highlighted message
 * - Empty and loading states
 * 
 * Uses shadcn/ui ScrollArea component.
 */

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils.js';
import type { HazoChatMessagesProps, ChatReferenceItem } from '../../types/index.js';
import { ChatBubble } from '../ui/chat_bubble.js';
import { LoadingSkeleton } from '../ui/loading_skeleton.js';
import { ScrollArea } from '../ui/scroll-area.js';
import { EMPTY_CHAT_MESSAGE } from '../../lib/constants.js';

// ============================================================================
// Component
// ============================================================================

export function HazoChatMessages({
  messages,
  current_user_id,
  timezone,
  is_loading,
  has_more,
  on_load_more,
  on_delete_message,
  on_scroll_to_message,
  highlighted_message_id,
  className
}: HazoChatMessagesProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const load_more_trigger_ref = useRef<HTMLDivElement>(null);
  const is_at_bottom_ref = useRef(true);
  const previous_messages_length_ref = useRef(0);

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

    // Only auto-scroll if we were at the bottom and new messages arrived
    if (is_at_bottom_ref.current && messages.length > previous_messages_length_ref.current) {
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
  const handle_reference_click = useCallback((reference: ChatReferenceItem) => {
    // This would be handled by parent via context
    console.log('[HazoChatMessages] Reference clicked:', reference);
  }, []);

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
          'flex flex-col-reverse' // Reverse order for bottom-up display
        )}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Messages (in reverse chronological order) */}
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            is_sender={message.sender_user_id === current_user_id}
            sender_profile={message.sender_profile}
            timezone={timezone}
            on_delete={
              message.sender_user_id === current_user_id
                ? () => on_delete_message(message.id)
                : undefined
            }
            on_reference_click={handle_reference_click}
            is_highlighted={highlighted_message_id === message.id}
          />
        ))}

        {/* Load more trigger */}
        {has_more && (
          <div
            ref={load_more_trigger_ref}
            className="cls_load_more_trigger py-4"
          >
            <LoadingSkeleton variant="message" count={2} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

HazoChatMessages.displayName = 'HazoChatMessages';
