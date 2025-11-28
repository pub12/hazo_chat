# UI Design Standards for hazo_chat

This document defines the visual design standards and component behavior specifications for the hazo_chat component library. All consuming projects should follow these standards to ensure consistent UI appearance and behavior.

---

## Visual Design Elements

### Document Preview Icon

**Location:** Empty state in document viewer (`HazoChatDocumentViewer`)

**Specification:**
- Icon: `IoDocumentOutline` (from `react-icons/io5`)
- Size: `w-12 h-12` (48px × 48px)
- Opacity: `opacity-50`
- Text: "Select a document to preview" in `text-sm`

**File Reference:** `src/components/hazo_chat/hazo_chat_document_viewer.tsx` (EmptyState component)

### REFERENCES Section Font

**Location:** References section header (`hazo_chat.tsx`)

**Specification:**
- Font size: `text-[9px]` (9px)
- Font weight: `font-medium`
- Text transform: `uppercase`
- Letter spacing: `tracking-wider`
- Color: `text-muted-foreground`

**File Reference:** `src/components/hazo_chat/hazo_chat.tsx` (line ~299)

### Input Area Padding

**Location:** Chat input container (`HazoChatInput`)

**Specification:**
- Padding: `p-4` (16px on all sides)
- Border: `border-t` (top border only)
- Background: `bg-background`

**File Reference:** `src/components/hazo_chat/hazo_chat_input.tsx` (line ~107)

### Message Timestamp Display

**Location:** Chat bubble footer (`ChatBubble`)

**Specification:**
- Only timestamp is displayed (no status icons for sent/unread messages)
- Font size: `text-xs`
- Color: `text-muted-foreground`
- Format: 24-hour format (e.g., "10:37 AM", "15:51")
- Timezone: Respects `timezone` prop (default: "GMT+10")

**File Reference:** `src/components/ui/chat_bubble.tsx` (line ~264)

### Read Receipt Indicator

**Location:** Chat bubble footer, after timestamp (`ChatBubble`)

**Specification:**
- Icon: `IoCheckmarkDoneSharp` (from `react-icons/io5`)
- Size: `h-4 w-4` (16px × 16px)
- Color: `text-green-500`
- Display condition: Only shown when `read_at` is not null AND message is from sender
- Position: After timestamp with `gap-1` spacing

**File Reference:** `src/components/ui/chat_bubble.tsx` (line ~267)

---

## Component Behavior

### Close Button

**Location:** Chat header (`HazoChatHeader`)

**Specification:**
- Visibility: Always visible when `on_close` prop is provided to `HazoChat` component
- Icon: `IoClose` (from `react-icons/io5`)
- Size: `h-8 w-8` (32px × 32px)
- Variant: `ghost`
- Hover state: `hover:bg-destructive/10 hover:text-destructive`
- Position: Top-right of header, after refresh button

**File Reference:** `src/components/hazo_chat/hazo_chat_header.tsx` (line ~124-147)

### Hamburger Menu Button

**Location:** Chat header (`HazoChatHeader`)

**Specification:**
- Desktop behavior: Hidden (`md:hidden` class)
- Mobile behavior: Visible on screens < 768px
- Purpose: Toggle document viewer sidebar on mobile
- Icon: `IoMenuOutline` (from `react-icons/io5`)
- Size: `h-8 w-8` (32px × 32px)
- Position: Top-left of header, before title

**Important:** If hamburger button appears on desktop, check Tailwind CSS configuration and ensure `md:` breakpoint utilities are working correctly.

**File Reference:** `src/components/hazo_chat/hazo_chat_header.tsx` (line ~54-77)

### Document Viewer Toggle Button

**Location:** Between document viewer and chat area (`hazo_chat.tsx`)

**Specification:**
- Icon: Chevron (`IoChevronBack` when expanded, `IoChevronForward` when collapsed)
- Size: `h-8 w-6` (32px height × 24px width)
- Position: Absolute, vertically centered between columns
- Variant: `outline`
- Border: `rounded-r-md rounded-l-none border-l-0`
- Behavior: Smooth transitions with `transition-all duration-300`
- Desktop: Visible when document viewer column is present
- Mobile: Hidden when sidebar is closed

**File Reference:** `src/components/hazo_chat/hazo_chat.tsx` (line ~344-367)

### References Section Collapse/Expand

**Location:** References row (`hazo_chat.tsx`)

**Specification:**
- Collapsed height: `max-h-8`
- Expanded height: `max-h-96`
- Transition: `transition-all duration-300 ease-in-out`
- Indicator: Chevron icon (`IoChevronDown` when collapsed, `IoChevronUp` when expanded)
- Default state: Collapsed when no references, expanded when references exist
- Auto-expand: Automatically expands when references are added

**File Reference:** `src/components/hazo_chat/hazo_chat.tsx` (line ~288-318)

---

## Layout Standards

### Chat Input Area

**Location:** Bottom of chat component (`HazoChatInput`)

**Specification:**
- Layout: Flex container with `flex items-center gap-2`
- Components:
  - Single `Input` field (replaces previous Textarea)
  - Send button (`Button` with `IoSend` icon)
- No attachment buttons: Attachment/image buttons removed for simplified design
- Input padding: `p-4` on container
- Button alignment: Aligned with input height using flex

**File Reference:** `src/components/hazo_chat/hazo_chat_input.tsx` (line ~119-144)

### Button Alignment and Sizing

**Specification:**
- Send button: Standard button size, aligned with input
- All interactive buttons: Consistent sizing for visual harmony
- Icon sizes within buttons: `w-4 h-4` (16px × 16px)

### Responsive Breakpoints

**Specification:**
- Mobile: < 768px (default)
- Desktop: >= 768px (`md:` prefix)
- Standard Tailwind breakpoints used throughout

---

## Color and Theming

### Required CSS Variables

The following CSS variables must be defined in the consuming project's global CSS file:

**Core Colors:**
- `--background`
- `--foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--muted` / `--muted-foreground`
- `--accent` / `--accent-foreground`
- `--destructive` / `--destructive-foreground`

**Border and Input:**
- `--border`
- `--input`
- `--ring`

**Card:**
- `--card` / `--card-foreground`

**Reference:** See `test-app/src/app/globals.css` for complete variable definitions.

---

## Typography

### Font Families

**Primary:** System font stack or custom font via `--font-sans` CSS variable

**Monospace:** System monospace or custom font via `--font-mono` CSS variable

### Font Sizes

- Header title: `text-sm` (14px)
- Header subtitle: `text-xs` (12px)
- Message text: `text-sm` (14px)
- Timestamp: `text-xs` (12px)
- References header: `text-[9px]` (9px)
- Empty state text: `text-sm` (14px)

---

## Spacing and Padding

### Standard Padding Values

- Container padding: `p-4` (16px)
- Header padding: `px-4` (16px horizontal)
- Message bubble padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Gap between elements: `gap-2` (8px) or `gap-1` (4px) for tight spacing

---

## Animation and Transitions

### Standard Transitions

- Component state changes: `transition-all duration-300`
- Hover states: `transition-colors`
- Smooth animations for expand/collapse: `ease-in-out`

### Loading States

- Skeleton loaders for initial message load
- Spinner animation for refresh button when loading
- Pulse animation removed from status indicators

---

## Accessibility

### ARIA Labels

All interactive elements must have appropriate ARIA labels:

- Input fields: `aria-label="Message input"`
- Buttons: `aria-label` describing action (e.g., "Send message", "Refresh chat history")
- Close button: `aria-label="Close chat"`
- Toggle buttons: `aria-label` and `aria-expanded` attributes

### Keyboard Navigation

- Send message: Enter key
- Close dialogs: Escape key (handled by Alert Dialog component)

---

## Component Dependencies

### Required External Components

The following components must be available in consuming projects:

1. **AlertDialog** (shadcn/ui style)
   - Used for user acknowledgment dialogs
   - Not included in hazo_chat package
   - Must be created by consuming project

2. **Toaster** (from `sonner` package)
   - Used for toast notifications (FYI messages)
   - Must be added to root layout
   - Position: `top-right`
   - Configuration: `richColors` prop enabled

### Included Components

The following UI components are included in hazo_chat package:

- Button
- Input
- Textarea
- Avatar
- ScrollArea
- Tooltip
- Separator
- Badge
- ChatBubble (chat-specific)
- LoadingSkeleton (chat-specific)

---

## Example Reference

For complete implementation examples, see:
- `test-app/src/app/page.tsx` - Usage example
- `test-app/src/app/layout.tsx` - Toaster setup
- `test-app/src/components/ui/alert-dialog.tsx` - Alert Dialog implementation
- `test-app/src/app/globals.css` - CSS variables example
- `test-app/tailwind.config.ts` - Tailwind configuration example

---

## Version Information

**Document Version:** 1.0  
**Last Updated:** 2024  
**Applies to hazo_chat version:** 2.0.8+

---

For setup instructions, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) and [README.md](./README.md).

