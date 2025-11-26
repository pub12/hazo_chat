/**
 * Skeleton Component (shadcn/ui style)
 * 
 * A loading placeholder component with pulse animation.
 */

'use client';

import * as React from 'react';
import { cn } from '../../lib/utils.js';

// ============================================================================
// Component
// ============================================================================

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };

