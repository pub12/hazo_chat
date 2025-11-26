/**
 * LoadingSkeleton Component
 * 
 * Pre-built loading skeleton layouts for the chat interface.
 * Uses the shadcn-style Skeleton component.
 */

'use client';

import * as React from 'react';
import { cn } from '../../lib/utils.js';
import { Skeleton } from './skeleton.js';

// ============================================================================
// Component Types
// ============================================================================

export interface LoadingSkeletonProps {
  /** Number of skeleton rows to display */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Type of skeleton layout */
  variant?: 'message' | 'reference' | 'profile';
}

// ============================================================================
// Component
// ============================================================================

export function LoadingSkeleton({
  count = 3,
  className,
  variant = 'message'
}: LoadingSkeletonProps) {
  const render_skeleton = () => {
    switch (variant) {
      case 'message':
        return (
          <>
            {Array.from({ length: count }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'cls_skeleton_message flex gap-2 mb-4',
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                )}
              >
                {index % 2 === 0 && (
                  <Skeleton className="h-8 w-8 rounded-full" />
                )}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                {index % 2 !== 0 && (
                  <Skeleton className="h-8 w-8 rounded-full" />
                )}
              </div>
            ))}
          </>
        );

      case 'reference':
        return (
          <>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="cls_skeleton_reference flex items-center gap-2 p-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </>
        );

      case 'profile':
        return (
          <div className="cls_skeleton_profile flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('cls_loading_skeleton', className)}>
      {render_skeleton()}
    </div>
  );
}

LoadingSkeleton.displayName = 'LoadingSkeleton';
