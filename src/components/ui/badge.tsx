/**
 * Badge Component (shadcn/ui style)
 * 
 * A badge component for status indicators and labels.
 * Uses class-variance-authority for variant management.
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

// ============================================================================
// Badge Variants
// ============================================================================

const badge_variants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning:
          'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ============================================================================
// Component Types
// ============================================================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badge_variants> {}

// ============================================================================
// Component
// ============================================================================

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badge_variants({ variant }), className)} {...props} />
  );
}

export { Badge, badge_variants };

