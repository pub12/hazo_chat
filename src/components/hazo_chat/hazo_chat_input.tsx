/**
 * HazoChatInput Component
 * 
 * Message input area with:
 * - Text input (shadcn Input component)
 * - Send button (shadcn Button component)
 * - Attachment preview (when attachments exist)
 * 
 * Uses shadcn/ui Input and Button components.
 */

'use client';

import React, {
  useState,
  useRef,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent
} from 'react';
import { IoSend } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type { HazoChatInputProps } from '../../types/index.js';
import { HazoChatAttachmentPreview } from './hazo_chat_attachment_preview.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';

// ============================================================================
// Component
// ============================================================================

export function HazoChatInput({
  on_send,
  pending_attachments,
  on_add_attachment,
  on_remove_attachment,
  is_disabled = false,
  placeholder = 'Type a message...',
  className
}: HazoChatInputProps) {
  const [message, set_message] = useState('');
  const input_ref = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Handle text change
  // -------------------------------------------------------------------------
  const handle_change = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      set_message(e.target.value);
    },
    []
  );

  // -------------------------------------------------------------------------
  // Handle send
  // -------------------------------------------------------------------------
  const handle_send = useCallback(() => {
    const trimmed = message.trim();
    const has_attachments = pending_attachments.length > 0;

    if (!trimmed && !has_attachments) return;
    if (is_disabled) return;

    // Convert pending attachments to uploaded files format
    const uploaded_files = pending_attachments
      .filter((a) => a.upload_status === 'uploaded' || a.upload_status === 'pending')
      .map((a) => ({
        id: a.id,
        name: a.file.name,
        url: '', // Will be filled after upload
        mime_type: a.file.type,
        file_size: a.file.size
      }));

    on_send(trimmed, uploaded_files);
    set_message('');

    // Reset input
    if (input_ref.current) {
      input_ref.current.value = '';
    }
  }, [message, pending_attachments, is_disabled, on_send]);

  // -------------------------------------------------------------------------
  // Handle keyboard events
  // -------------------------------------------------------------------------
  const handle_key_down = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Send on Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        handle_send();
      }
    },
    [handle_send]
  );

  // -------------------------------------------------------------------------
  // Check if can send
  // -------------------------------------------------------------------------
  const can_send = !is_disabled && (message.trim().length > 0 || pending_attachments.length > 0);

  return (
    <div
      className={cn(
        'cls_hazo_chat_input',
        'border-t bg-background p-3',
        className
      )}
    >
      {/* Attachment preview */}
      {pending_attachments.length > 0 && (
        <HazoChatAttachmentPreview
          attachments={pending_attachments}
          on_remove={on_remove_attachment}
        />
      )}

      {/* Input area */}
      <div className="cls_input_row flex items-center gap-2">
        {/* Text input */}
        <Input
          ref={input_ref}
          type="text"
          value={message}
          onChange={handle_change}
          onKeyDown={handle_key_down}
          placeholder={placeholder}
          disabled={is_disabled}
          className="cls_message_input flex-1"
          aria-label="Message input"
        />

        {/* Send button */}
        <Button
          variant="default"
          onClick={handle_send}
          disabled={!can_send}
          className="cls_send_btn"
          aria-label="Send message"
        >
          <IoSend className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

HazoChatInput.displayName = 'HazoChatInput';
