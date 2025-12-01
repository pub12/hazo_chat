/**
 * UI components barrel export file
 * 
 * Exports reusable UI components from the hazo_chat package.
 * All export paths use explicit .js extensions for ES module compatibility.
 */

// Shadcn-style components
export { Button, button_variants, type ButtonProps } from './button.js';
export { Input, type InputProps } from './input.js';
export { Textarea, type TextareaProps } from './textarea.js';
export { Avatar, AvatarImage, AvatarFallback } from './avatar.js';
export { Skeleton } from './skeleton.js';
export { ScrollArea, ScrollBar } from './scroll-area.js';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip.js';
export { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card.js';
export { Separator } from './separator.js';
export { Badge, badge_variants, type BadgeProps } from './badge.js';

// Chat-specific components
export { ChatBubble } from './chat_bubble.js';
export { LoadingSkeleton } from './loading_skeleton.js';
