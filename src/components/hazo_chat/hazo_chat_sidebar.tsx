/**
 * HazoChatSidebar Component
 * 
 * Collapsible sidebar containing:
 * - Reference list
 * - Document viewer
 * 
 * On mobile: slides in from left as overlay
 * On desktop: always visible as left column
 * 
 * Uses shadcn/ui Button, ScrollArea, and Separator components.
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { IoClose } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import type { HazoChatSidebarProps } from '../../types/index.js';
import { MOBILE_BREAKPOINT } from '../../lib/constants.js';
import { Button } from '../ui/button.js';
import { ScrollArea } from '../ui/scroll-area.js';
import { Separator } from '../ui/separator.js';

// ============================================================================
// Component
// ============================================================================

export function HazoChatSidebar({
  is_open,
  on_close,
  className,
  children
}: HazoChatSidebarProps) {
  // Handle escape key to close sidebar
  const handle_escape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && is_open) {
        on_close();
      }
    },
    [is_open, on_close]
  );

  // Handle click outside to close (mobile)
  const handle_backdrop_click = useCallback(() => {
    on_close();
  }, [on_close]);

  // Add escape key listener
  useEffect(() => {
    document.addEventListener('keydown', handle_escape);
    return () => {
      document.removeEventListener('keydown', handle_escape);
    };
  }, [handle_escape]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const is_mobile = window.innerWidth < MOBILE_BREAKPOINT;
    
    if (is_open && is_mobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [is_open]);

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className={cn(
          'cls_sidebar_backdrop',
          'fixed inset-0 bg-black/50 z-40',
          'md:hidden', // Only on mobile
          'transition-opacity duration-200',
          is_open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handle_backdrop_click}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'cls_hazo_chat_sidebar',
          // Mobile: fixed overlay
          'fixed md:relative',
          'top-0 left-0 h-full z-50',
          // Sizing
          'w-[280px] md:w-full',
          // Background
          'bg-background border-r',
          // Transition
          'transition-transform duration-200 ease-in-out',
          // Mobile: slide in/out
          is_open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
        aria-label="Chat sidebar"
        aria-hidden={!is_open}
      >
        {/* Mobile close button */}
        <div className="cls_sidebar_header flex items-center justify-between p-3 md:hidden">
          <span className="text-sm font-medium">Documents & References</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={on_close}
            className="h-8 w-8"
            aria-label="Close sidebar"
          >
            <IoClose className="w-4 h-4" />
          </Button>
        </div>

        <Separator className="md:hidden" />

        {/* Sidebar content */}
        <ScrollArea className="cls_sidebar_content h-full flex flex-col">
          {children}
        </ScrollArea>
      </aside>
    </>
  );
}

HazoChatSidebar.displayName = 'HazoChatSidebar';
