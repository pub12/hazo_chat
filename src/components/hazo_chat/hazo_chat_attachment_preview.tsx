/**
 * HazoChatAttachmentPreview Component
 * 
 * Shows thumbnails of pending file attachments before sending with:
 * - Image previews for image files
 * - File icon for non-image files
 * - Upload status indicator
 * - Remove button
 * 
 * Uses shadcn/ui Button and Badge components.
 */

'use client';

import React, { useCallback } from 'react';
import { IoClose, IoDocumentOutline, IoAlertCircle } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type { HazoChatAttachmentPreviewProps, PendingAttachment } from '../../types/index.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file extension from filename
 */
function get_file_extension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
}

/**
 * Format file size
 */
function format_file_size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Single Attachment Item
// ============================================================================

interface AttachmentItemProps {
  attachment: PendingAttachment;
  on_remove: () => void;
}

function AttachmentItem({ attachment, on_remove }: AttachmentItemProps) {
  const extension = get_file_extension(attachment.file.name);
  const is_image = attachment.file.type.startsWith('image/');
  const is_uploading = attachment.upload_status === 'uploading';
  const has_error = attachment.upload_status === 'failed';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'cls_attachment_item',
            'relative group',
            'w-16 h-16 rounded-lg overflow-hidden',
            'bg-muted border',
            has_error && 'border-destructive'
          )}
        >
          {/* Preview */}
          {is_image && attachment.preview_url ? (
            <img
              src={attachment.preview_url}
              alt={attachment.file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <IoDocumentOutline className="w-6 h-6 text-muted-foreground" />
              <span className="text-[8px] font-medium text-muted-foreground mt-1">
                {extension}
              </span>
            </div>
          )}

          {/* Upload progress overlay */}
          {is_uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error indicator */}
          {has_error && (
            <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
              <IoAlertCircle className="w-6 h-6 text-destructive" />
            </div>
          )}

          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={on_remove}
            className={cn(
              'cls_attachment_remove',
              'absolute top-0.5 right-0.5',
              'w-5 h-5 p-0',
              'bg-black/60 text-white hover:bg-black/80',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}
            aria-label={`Remove ${attachment.file.name}`}
          >
            <IoClose className="w-3 h-3" />
          </Button>

          {/* File size badge */}
          <Badge
            variant="secondary"
            className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] px-1 py-0 justify-center bg-black/60 text-white border-0"
          >
            {format_file_size(attachment.file.size)}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{attachment.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {format_file_size(attachment.file.size)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HazoChatAttachmentPreview({
  attachments,
  on_remove,
  className
}: HazoChatAttachmentPreviewProps) {
  const handle_remove = useCallback(
    (attachment_id: string) => {
      on_remove(attachment_id);
    },
    [on_remove]
  );

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'cls_hazo_chat_attachment_preview',
        'flex flex-wrap gap-2 p-2 border-t bg-muted/30',
        className
      )}
      role="list"
      aria-label="Pending attachments"
    >
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          on_remove={() => handle_remove(attachment.id)}
        />
      ))}
    </div>
  );
}

HazoChatAttachmentPreview.displayName = 'HazoChatAttachmentPreview';
