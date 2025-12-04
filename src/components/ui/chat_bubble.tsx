/**
 * ChatBubble Component
 * 
 * Renders a single chat message bubble with:
 * - Profile picture (using Avatar)
 * - Message text (or deleted placeholder)
 * - Timestamp with timezone formatting
 * - Delete option for sender's messages (using Button)
 * - Reference/attachment icons
 * 
 * Uses shadcn/ui Avatar, Button, Tooltip, and HoverCard components.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  IoTrashOutline,
  IoDocumentAttachSharp,
  IoCheckmarkDoneSharp,
  IoCheckmark
} from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type { ChatBubbleProps, ChatReferenceItem } from '../../types/index.js';
import { DELETED_MESSAGE_PLACEHOLDER } from '../../lib/constants.js';
import { Avatar, AvatarImage, AvatarFallback } from './avatar.js';
import { Button } from './button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from './tooltip.js';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from './hover-card.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a date is today
 */
function is_today(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Format timestamp with timezone (short format for display)
 * Includes date prefix in dd/MMM format if message is from a previous day
 */
function format_timestamp(timestamp: string, timezone: string): string {
  try {
    const date = new Date(timestamp);
    const zoned_date = toZonedTime(date, timezone);
    
    // Check if message is from today
    if (is_today(zoned_date)) {
      return format(zoned_date, 'HH:mm');
    } else {
      // Include date prefix for messages before today
      return format(zoned_date, 'dd/MMM HH:mm');
    }
  } catch {
    const date = new Date(timestamp);
    if (is_today(date)) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'dd/MMM HH:mm');
    }
  }
}

/**
 * Format full timestamp with timezone (for hovercard display)
 */
function format_full_timestamp(timestamp: string, timezone: string): string {
  try {
    const date = new Date(timestamp);
    const zoned_date = toZonedTime(date, timezone);
    return format(zoned_date, 'PPpp'); // Full date and time format
  } catch {
    return format(new Date(timestamp), 'PPpp');
  }
}

/**
 * Get initials from name
 */
function get_initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// ============================================================================
// Component
// ============================================================================

export function ChatBubble({
  message,
  is_sender,
  sender_profile,
  timezone,
  on_delete,
  on_reference_click,
  is_highlighted = false,
  show_delete_button = true,
  bubble_radius = 'default',
  className
}: ChatBubbleProps) {
  const [show_delete_confirm, set_show_delete_confirm] = useState(false);

  const is_deleted = message.deleted_at !== null;
  const display_text = is_deleted ? DELETED_MESSAGE_PLACEHOLDER : message.message_text;
  const has_references = message.reference_list && message.reference_list.length > 0;

  // Handle delete click
  const handle_delete_click = useCallback(() => {
    if (show_delete_confirm) {
      on_delete?.();
      set_show_delete_confirm(false);
    } else {
      set_show_delete_confirm(true);
      // Auto-hide after 3 seconds
      setTimeout(() => set_show_delete_confirm(false), 3000);
    }
  }, [show_delete_confirm, on_delete]);

  // Handle reference click
  const handle_reference_click = useCallback(
    (reference: ChatReferenceItem) => {
      on_reference_click?.(reference);
    },
    [on_reference_click]
  );

  return (
    <div
      className={cn(
        'cls_chat_bubble_wrapper',
        'flex w-full mb-4 group',
        is_sender ? 'justify-end' : 'justify-start',
        is_highlighted && 'animate-pulse bg-primary/5 -mx-2 px-2 py-1 rounded-lg',
        className
      )}
      id={`message-${message.id}`}
    >
      {/* Avatar for received messages */}
      {!is_sender && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Avatar className="cls_bubble_avatar h-8 w-8 mr-2 flex-shrink-0 cursor-pointer">
              <AvatarImage
                src={sender_profile?.avatar_url}
                alt={`${sender_profile?.name || 'User'} avatar`}
              />
              <AvatarFallback className="text-xs">
                {get_initials(sender_profile?.name)}
              </AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" side="right" align="start">
            <div className="cls_hovercard_content flex flex-col gap-4">
              {/* Profile information */}
              {sender_profile && (
                <div className="cls_profile_info flex items-center gap-3">
                  <Avatar className="cls_hovercard_avatar h-12 w-12">
                    <AvatarImage
                      src={sender_profile.avatar_url}
                      alt={`${sender_profile.name} avatar`}
                    />
                    <AvatarFallback>
                      {get_initials(sender_profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="cls_profile_details flex flex-col gap-1">
                    <span className="text-sm font-semibold">{sender_profile.name}</span>
                    {sender_profile.email && (
                      <span className="text-xs text-muted-foreground">
                        {sender_profile.email}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Divider */}
              <div className="cls_divider border-t border-border" />
              
              {/* Sent timestamp */}
              <div className="cls_sent_info flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Sent</span>
                <span className="text-sm font-semibold">
                  {format_full_timestamp(message.created_at, timezone)}
                </span>
              </div>
              {/* Read timestamp (only if read) */}
              {message.read_at && (
                <div className="cls_read_info flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Read</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {format_full_timestamp(message.read_at, timezone)}
                  </span>
                </div>
              )}
              {!message.read_at && (
                <div className="cls_read_info flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Read</span>
                  <span className="text-sm font-medium text-muted-foreground italic">
                    Not read yet
                  </span>
                </div>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}

      {/* Message bubble */}
      <div className="cls_bubble_content flex flex-col max-w-[70%]">
        {/* Sender name for received messages */}
        {!is_sender && sender_profile?.name && (
          <span className="cls_bubble_sender text-xs text-muted-foreground mb-1 ml-1">
            {sender_profile.name}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'cls_bubble',
            'px-4 py-2 relative',
            // Background colors
            is_sender
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
            // Bubble radius styling
            bubble_radius === 'full'
              ? 'rounded-2xl' // Fully round all corners (1rem = 16px)
              : is_sender
                ? 'rounded-[16px_16px_6px_16px]' // Default sender style
                : 'rounded-[16px_16px_16px_6px]', // Default receiver style
            is_deleted && 'opacity-60 italic'
          )}
        >
          {/* Message text */}
          <p className="cls_bubble_text text-sm whitespace-pre-wrap break-words">
            {display_text}
          </p>

          {/* Reference attachments */}
          {has_references && !is_deleted && (
            <div className="cls_bubble_references flex flex-wrap gap-1 mt-2 pt-2 border-t border-current/10">
              {message.reference_list?.map((ref) => (
                <Button
                  key={ref.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handle_reference_click(ref)}
                  className={cn(
                    'cls_bubble_reference_btn',
                    'h-6 px-2 text-xs',
                    is_sender
                      ? 'hover:bg-primary-foreground/20'
                      : 'hover:bg-background/50'
                  )}
                >
                  <IoDocumentAttachSharp className="w-3 h-3 mr-1" />
                  <span className="truncate max-w-[100px]">{ref.name}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Delete button for sender's messages */}
          {show_delete_button && is_sender && !is_deleted && on_delete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={show_delete_confirm ? 'destructive' : 'ghost'}
                  size="icon"
                  onClick={handle_delete_click}
                  className={cn(
                    'cls_bubble_delete_btn',
                    'absolute -left-8 top-1/2 -translate-y-1/2',
                    'w-6 h-6',
                    'opacity-0 group-hover:opacity-100 transition-opacity'
                  )}
                >
                  <IoTrashOutline className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {show_delete_confirm ? 'Click again to confirm' : 'Delete message'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Timestamp and read status */}
        <div
          className={cn(
            'cls_bubble_meta',
            'flex items-center gap-1 mt-1',
            is_sender ? 'justify-end mr-1' : 'ml-1'
          )}
          style={{ flexDirection: 'row' }} // Explicitly force row direction to prevent any reversal
        >
          {/* Time always comes first in DOM order */}
          <span className="cls_bubble_time text-xs text-muted-foreground">
            {format_timestamp(message.created_at, timezone)}
          </span>
          {/* Status indicators for sender's messages */}
          {is_sender && (
            <>
              {/* Read receipt: double green tick - shown when message has been read */}
              {message.read_at && (
                <IoCheckmarkDoneSharp className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
              {/* Sent indicator: single grey tick - shown when message sent but not read */}
              {!message.read_at && (
                <IoCheckmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Avatar for sent messages */}
      {is_sender && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Avatar className="cls_bubble_avatar h-8 w-8 ml-2 flex-shrink-0 cursor-pointer">
              <AvatarImage
                src={sender_profile?.avatar_url}
                alt="Your avatar"
              />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {get_initials(sender_profile?.name)}
              </AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" side="left" align="start">
            <div className="cls_hovercard_content flex flex-col gap-4">
              {/* Profile information */}
              {sender_profile && (
                <div className="cls_profile_info flex items-center gap-3">
                  <Avatar className="cls_hovercard_avatar h-12 w-12">
                    <AvatarImage
                      src={sender_profile.avatar_url}
                      alt={`${sender_profile.name} avatar`}
                    />
                    <AvatarFallback>
                      {get_initials(sender_profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="cls_profile_details flex flex-col gap-1">
                    <span className="text-sm font-semibold">{sender_profile.name}</span>
                    {sender_profile.email && (
                      <span className="text-xs text-muted-foreground">
                        {sender_profile.email}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Divider */}
              <div className="cls_divider border-t border-border" />
              
              {/* Sent timestamp */}
              <div className="cls_sent_info flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Sent</span>
                <span className="text-sm font-semibold">
                  {format_full_timestamp(message.created_at, timezone)}
                </span>
              </div>
              {/* Read timestamp (only if read) */}
              {message.read_at && (
                <div className="cls_read_info flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Read</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {format_full_timestamp(message.read_at, timezone)}
                  </span>
                </div>
              )}
              {!message.read_at && (
                <div className="cls_read_info flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Read</span>
                  <span className="text-sm font-medium text-muted-foreground italic">
                    Not read yet
                  </span>
                </div>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}

ChatBubble.displayName = 'ChatBubble';
