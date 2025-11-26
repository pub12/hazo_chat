/**
 * Textarea Component (shadcn/ui style)
 * 
 * A styled multi-line text input component.
 */

'use client';

import * as React from 'react';
import { cn } from '../../lib/utils.js';

// ============================================================================
// Component Types
// ============================================================================

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// ============================================================================
// Component
// ============================================================================

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };

