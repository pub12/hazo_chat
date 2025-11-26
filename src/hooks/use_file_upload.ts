/**
 * useFileUpload Hook
 * 
 * Manages file uploads with:
 * - File validation (size, type)
 * - Preview generation for images
 * - Upload progress tracking
 * - Batch upload support
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  PendingAttachment,
  UploadedFile,
  FileValidationResult,
  UseFileUploadReturn
} from '../types/index.js';
import {
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_ALLOWED_TYPES,
  MIME_TYPE_MAP
} from '../lib/constants.js';

// ============================================================================
// Hook Parameters
// ============================================================================

interface UseFileUploadParams {
  /** Path/bucket for uploaded files */
  upload_location: string;
  /** Maximum file size in MB */
  max_file_size_mb?: number;
  /** Allowed file extensions */
  allowed_types?: string[];
  /** Upload function to call for each file */
  upload_function?: (file: File, location: string) => Promise<UploadedFile>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file extension from filename
 */
function get_file_extension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Generate unique ID for attachment
 */
function generate_attachment_id(): string {
  return `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create preview URL for image files
 */
function create_preview_url(file: File): string | undefined {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return undefined;
}

/**
 * Default upload function (placeholder - should be overridden)
 */
async function default_upload_function(
  file: File,
  location: string
): Promise<UploadedFile> {
  // This is a placeholder implementation
  // In real usage, this would upload to cloud storage (e.g., Supabase Storage)
  console.warn(
    '[useFileUpload] Using default upload function. Override with upload_function prop.'
  );

  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: generate_attachment_id(),
    name: file.name,
    url: `${location}/${file.name}`,
    mime_type: file.type,
    file_size: file.size
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFileUpload({
  upload_location,
  max_file_size_mb = DEFAULT_MAX_FILE_SIZE_MB,
  allowed_types = DEFAULT_ALLOWED_TYPES,
  upload_function = default_upload_function
}: UseFileUploadParams): UseFileUploadReturn {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [pending_attachments, set_pending_attachments] = useState<PendingAttachment[]>([]);
  const [is_uploading, set_is_uploading] = useState(false);
  const [validation_errors, set_validation_errors] = useState<string[]>([]);

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const is_mounted_ref = useRef(true);

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const validate_file = useCallback(
    (file: File): FileValidationResult => {
      // Check file size
      const max_size_bytes = max_file_size_mb * 1024 * 1024;
      if (file.size > max_size_bytes) {
        return {
          valid: false,
          error: `File "${file.name}" exceeds maximum size of ${max_file_size_mb}MB`
        };
      }

      // Check file type
      const extension = get_file_extension(file.name);
      if (!allowed_types.includes(extension)) {
        return {
          valid: false,
          error: `File type "${extension}" is not allowed. Allowed types: ${allowed_types.join(', ')}`
        };
      }

      return { valid: true };
    },
    [max_file_size_mb, allowed_types]
  );

  // -------------------------------------------------------------------------
  // Add files
  // -------------------------------------------------------------------------
  const add_files = useCallback(
    (files: File[]) => {
      const new_errors: string[] = [];
      const valid_attachments: PendingAttachment[] = [];

      files.forEach((file) => {
        const validation = validate_file(file);

        if (!validation.valid && validation.error) {
          new_errors.push(validation.error);
          return;
        }

        const attachment: PendingAttachment = {
          id: generate_attachment_id(),
          file,
          preview_url: create_preview_url(file),
          upload_status: 'pending'
        };

        valid_attachments.push(attachment);
      });

      if (new_errors.length > 0) {
        set_validation_errors((prev) => [...prev, ...new_errors]);
      }

      if (valid_attachments.length > 0) {
        set_pending_attachments((prev) => [...prev, ...valid_attachments]);
      }
    },
    [validate_file]
  );

  // -------------------------------------------------------------------------
  // Remove file
  // -------------------------------------------------------------------------
  const remove_file = useCallback((attachment_id: string) => {
    set_pending_attachments((prev) => {
      const attachment = prev.find((a) => a.id === attachment_id);
      
      // Revoke object URL to prevent memory leaks
      if (attachment?.preview_url) {
        URL.revokeObjectURL(attachment.preview_url);
      }

      return prev.filter((a) => a.id !== attachment_id);
    });
  }, []);

  // -------------------------------------------------------------------------
  // Upload single file
  // -------------------------------------------------------------------------
  const upload_single_file = useCallback(
    async (attachment: PendingAttachment): Promise<UploadedFile | null> => {
      // Update status to uploading
      set_pending_attachments((prev) =>
        prev.map((a) =>
          a.id === attachment.id
            ? { ...a, upload_status: 'uploading' as const }
            : a
        )
      );

      try {
        const result = await upload_function(attachment.file, upload_location);

        // Update status to uploaded
        if (is_mounted_ref.current) {
          set_pending_attachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id
                ? { ...a, upload_status: 'uploaded' as const }
                : a
            )
          );
        }

        return result;
      } catch (error) {
        console.error('[useFileUpload] Upload error:', error);

        // Update status to failed
        if (is_mounted_ref.current) {
          set_pending_attachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id
                ? {
                    ...a,
                    upload_status: 'failed' as const,
                    error_message: error instanceof Error ? error.message : 'Upload failed'
                  }
                : a
            )
          );
        }

        return null;
      }
    },
    [upload_function, upload_location]
  );

  // -------------------------------------------------------------------------
  // Upload all pending files
  // -------------------------------------------------------------------------
  const upload_all = useCallback(async (): Promise<UploadedFile[]> => {
    const pending = pending_attachments.filter(
      (a) => a.upload_status === 'pending' || a.upload_status === 'failed'
    );

    if (pending.length === 0) {
      return [];
    }

    set_is_uploading(true);
    set_validation_errors([]);

    try {
      const results = await Promise.all(
        pending.map((attachment) => upload_single_file(attachment))
      );

      // Filter out failed uploads
      const successful = results.filter(
        (result): result is UploadedFile => result !== null
      );

      return successful;
    } finally {
      if (is_mounted_ref.current) {
        set_is_uploading(false);
      }
    }
  }, [pending_attachments, upload_single_file]);

  // -------------------------------------------------------------------------
  // Clear all
  // -------------------------------------------------------------------------
  const clear_all = useCallback(() => {
    // Revoke all object URLs
    pending_attachments.forEach((attachment) => {
      if (attachment.preview_url) {
        URL.revokeObjectURL(attachment.preview_url);
      }
    });

    set_pending_attachments([]);
    set_validation_errors([]);
  }, [pending_attachments]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    pending_attachments,
    add_files,
    remove_file,
    upload_all,
    clear_all,
    is_uploading,
    validation_errors
  };
}

