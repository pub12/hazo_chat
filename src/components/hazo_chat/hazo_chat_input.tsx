/**
 * HazoChatInput Component
 * 
 * Message input area with:
 * - Text input (auto-resizing textarea)
 * - File attachment buttons
 * - Drag-and-drop support
 * - Send button
 * - Attachment preview
 * 
 * Uses shadcn/ui Textarea, Button, and Tooltip components.
 */

'use client';

import React, {
  useState,
  useRef,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  type DragEvent
} from 'react';
import { IoSend, IoAttach, IoImageOutline } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type { HazoChatInputProps } from '../../types/index.js';
import { HazoChatAttachmentPreview } from './hazo_chat_attachment_preview.js';
import { Button } from '../ui/button.js';
import { Textarea } from '../ui/textarea.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip.js';

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
  const [is_dragging, set_is_dragging] = useState(false);
  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const file_input_ref = useRef<HTMLInputElement>(null);
  const image_input_ref = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Auto-resize textarea
  // -------------------------------------------------------------------------
  const resize_textarea = useCallback(() => {
    const textarea = textarea_ref.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  // -------------------------------------------------------------------------
  // Handle text change
  // -------------------------------------------------------------------------
  const handle_change = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      set_message(e.target.value);
      resize_textarea();
    },
    [resize_textarea]
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

    // Reset textarea height
    if (textarea_ref.current) {
      textarea_ref.current.style.height = 'auto';
    }
  }, [message, pending_attachments, is_disabled, on_send]);

  // -------------------------------------------------------------------------
  // Handle keyboard events
  // -------------------------------------------------------------------------
  const handle_key_down = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter without Shift
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handle_send();
      }
    },
    [handle_send]
  );

  // -------------------------------------------------------------------------
  // Handle file selection
  // -------------------------------------------------------------------------
  const handle_file_change = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        on_add_attachment(files);
      }
      // Reset input
      e.target.value = '';
    },
    [on_add_attachment]
  );

  // -------------------------------------------------------------------------
  // Handle drag events
  // -------------------------------------------------------------------------
  const handle_drag_over = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(true);
  }, []);

  const handle_drag_leave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(false);
  }, []);

  const handle_drop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      set_is_dragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        on_add_attachment(files);
      }
    },
    [on_add_attachment]
  );

  // -------------------------------------------------------------------------
  // Trigger file inputs
  // -------------------------------------------------------------------------
  const handle_attach_click = useCallback(() => {
    file_input_ref.current?.click();
  }, []);

  const handle_image_click = useCallback(() => {
    image_input_ref.current?.click();
  }, []);

  // -------------------------------------------------------------------------
  // Check if can send
  // -------------------------------------------------------------------------
  const can_send = !is_disabled && (message.trim().length > 0 || pending_attachments.length > 0);

  return (
    <div
      className={cn(
        'cls_hazo_chat_input',
        'flex flex-col border-t bg-background',
        is_dragging && 'ring-2 ring-primary ring-inset',
        className
      )}
      onDragOver={handle_drag_over}
      onDragLeave={handle_drag_leave}
      onDrop={handle_drop}
    >
      {/* Attachment preview */}
      <HazoChatAttachmentPreview
        attachments={pending_attachments}
        on_remove={on_remove_attachment}
      />

      {/* Input area */}
      <div className="cls_input_row flex items-end gap-2 p-3">
        {/* Attachment button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handle_attach_click}
              disabled={is_disabled}
              className="cls_attach_btn h-12 w-12 text-muted-foreground hover:text-foreground"
              aria-label="Attach file"
            >
              <IoAttach className="w-8 h-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach file</TooltipContent>
        </Tooltip>

        {/* Image button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handle_image_click}
              disabled={is_disabled}
              className="cls_image_btn h-12 w-12 text-muted-foreground hover:text-foreground"
              aria-label="Attach image"
            >
              <IoImageOutline className="w-8 h-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach image</TooltipContent>
        </Tooltip>

        {/* Hidden file inputs */}
        <input
          ref={file_input_ref}
          type="file"
          multiple
          onChange={handle_file_change}
          className="hidden"
          aria-hidden="true"
        />
        <input
          ref={image_input_ref}
          type="file"
          accept="image/*"
          multiple
          onChange={handle_file_change}
          className="hidden"
          aria-hidden="true"
        />

        {/* Text input */}
        <Textarea
          ref={textarea_ref}
          value={message}
          onChange={handle_change}
          onKeyDown={handle_key_down}
          placeholder={placeholder}
          disabled={is_disabled}
          rows={1}
          className={cn(
            'cls_message_textarea',
            'flex-1 resize-none',
            'min-h-[40px] max-h-[120px]'
          )}
          aria-label="Message input"
        />

        {/* Send button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={handle_send}
              disabled={!can_send}
              className="cls_send_btn"
              aria-label="Send message"
            >
              <IoSend className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send message (Enter)</TooltipContent>
        </Tooltip>
      </div>

      {/* Drag overlay */}
      {is_dragging && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
          <p className="text-primary font-medium">Drop files here</p>
        </div>
      )}
    </div>
  );
}

HazoChatInput.displayName = 'HazoChatInput';
