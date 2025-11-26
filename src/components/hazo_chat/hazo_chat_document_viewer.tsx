/**
 * HazoChatDocumentViewer Component
 * 
 * Document preview area supporting:
 * - PDF viewing via hazo_pdf
 * - Image preview (png, jpg, gif, webp)
 * - Text file preview
 * - Download link for unsupported types
 */

'use client';

import React, { useMemo } from 'react';
import { IoDocumentOutline, IoDownloadOutline, IoImageOutline } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type { HazoChatDocumentViewerProps } from '../../types/index.js';
import { PREVIEWABLE_TYPES } from '../../lib/constants.js';
import { LoadingSkeleton } from '../ui/loading_skeleton.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if file is previewable as image
 */
function is_image(mime_type?: string): boolean {
  if (!mime_type) return false;
  return PREVIEWABLE_TYPES.image.includes(mime_type);
}

/**
 * Check if file is previewable as PDF
 */
function is_pdf(mime_type?: string): boolean {
  if (!mime_type) return false;
  return PREVIEWABLE_TYPES.pdf.includes(mime_type);
}

/**
 * Check if file is previewable as text
 */
function is_text(mime_type?: string): boolean {
  if (!mime_type) return false;
  return PREVIEWABLE_TYPES.text.includes(mime_type);
}

// ============================================================================
// PDF Viewer Component
// ============================================================================

interface PdfViewerProps {
  url: string;
  name: string;
}

function PdfViewer({ url, name }: PdfViewerProps) {
  // Note: In production, this would use hazo_pdf component
  // For now, we use an iframe fallback
  return (
    <div className="cls_pdf_viewer w-full h-full flex flex-col">
      <iframe
        src={`${url}#view=FitH`}
        title={name}
        className="w-full flex-1 border-0 rounded-lg"
        aria-label={`PDF document: ${name}`}
      />
    </div>
  );
}

// ============================================================================
// Image Viewer Component
// ============================================================================

interface ImageViewerProps {
  url: string;
  name: string;
}

function ImageViewer({ url, name }: ImageViewerProps) {
  return (
    <div className="cls_image_viewer w-full h-full flex items-center justify-center p-4 overflow-auto">
      <img
        src={url}
        alt={name}
        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
      />
    </div>
  );
}

// ============================================================================
// Text Viewer Component
// ============================================================================

interface TextViewerProps {
  url: string;
  name: string;
}

function TextViewer({ url, name }: TextViewerProps) {
  const [content, set_content] = React.useState<string | null>(null);
  const [is_loading, set_is_loading] = React.useState(true);
  const [error, set_error] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetch_content() {
      try {
        set_is_loading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const text = await response.text();
        set_content(text);
      } catch (err) {
        set_error('Failed to load text content');
      } finally {
        set_is_loading(false);
      }
    }

    fetch_content();
  }, [url]);

  if (is_loading) {
    return <LoadingSkeleton variant="reference" count={5} />;
  }

  if (error) {
    return (
      <div className="cls_text_viewer_error flex items-center justify-center h-full text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="cls_text_viewer w-full h-full overflow-auto p-4">
      <pre
        className="text-sm font-mono bg-muted p-4 rounded-lg whitespace-pre-wrap break-words"
        aria-label={`Text file: ${name}`}
      >
        {content}
      </pre>
    </div>
  );
}

// ============================================================================
// Download Fallback Component
// ============================================================================

interface DownloadFallbackProps {
  url: string;
  name: string;
  mime_type?: string;
}

function DownloadFallback({ url, name, mime_type }: DownloadFallbackProps) {
  return (
    <div className="cls_download_fallback flex flex-col items-center justify-center h-full gap-4 p-4">
      <IoDocumentOutline className="w-16 h-16 text-muted-foreground" />
      <div className="text-center">
        <p className="font-medium text-foreground">{name}</p>
        {mime_type && (
          <p className="text-sm text-muted-foreground mt-1">{mime_type}</p>
        )}
      </div>
      <a
        href={url}
        download={name}
        className={cn(
          'cls_download_btn',
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 transition-colors'
        )}
      >
        <IoDownloadOutline className="w-4 h-4" />
        Download
      </a>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState() {
  return (
    <div className="cls_viewer_empty flex flex-col items-center justify-center h-full gap-2 p-4 text-muted-foreground">
      <IoImageOutline className="w-12 h-12 opacity-50" />
      <p className="text-sm">Select a document to preview</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HazoChatDocumentViewer({
  reference,
  className
}: HazoChatDocumentViewerProps) {
  // Determine viewer type based on mime_type
  const viewer_type = useMemo(() => {
    if (!reference) return 'empty';
    if (is_pdf(reference.mime_type)) return 'pdf';
    if (is_image(reference.mime_type)) return 'image';
    if (is_text(reference.mime_type)) return 'text';
    return 'download';
  }, [reference]);

  return (
    <div
      className={cn(
        'cls_hazo_chat_document_viewer',
        'flex-1 bg-muted/30 rounded-lg overflow-hidden',
        className
      )}
      role="region"
      aria-label="Document viewer"
    >
      {viewer_type === 'empty' && <EmptyState />}

      {viewer_type === 'pdf' && reference && (
        <PdfViewer url={reference.url} name={reference.name} />
      )}

      {viewer_type === 'image' && reference && (
        <ImageViewer url={reference.url} name={reference.name} />
      )}

      {viewer_type === 'text' && reference && (
        <TextViewer url={reference.url} name={reference.name} />
      )}

      {viewer_type === 'download' && reference && (
        <DownloadFallback
          url={reference.url}
          name={reference.name}
          mime_type={reference.mime_type}
        />
      )}
    </div>
  );
}

HazoChatDocumentViewer.displayName = 'HazoChatDocumentViewer';

