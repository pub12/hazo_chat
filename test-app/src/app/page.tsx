/**
 * HazoChat Test Page
 * 
 * Demonstrates the hazo_chat component with hardcoded demo messages.
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  IoDocumentAttachSharp, 
  IoChatbubbleEllipses,
  IoExpand,
  IoLayers,
  IoClose,
  IoSend,
  IoAttach,
  IoImageOutline,
  IoCheckmarkOutline,
  IoCheckmarkDoneSharp,
  IoChevronBack,
  IoChevronForward
} from 'react-icons/io5';

// ============================================================================
// Demo Chat Component with Hardcoded Messages
// ============================================================================

interface DemoMessage {
  id: string;
  sender: 'me' | 'other';
  name: string;
  avatar: string;
  text: string;
  time: string;
  status: 'sent' | 'read';
  attachment?: { name: string; type: string };
}

const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: '1',
    sender: 'other',
    name: 'Sarah Chen',
    avatar: 'SC',
    text: "Hi John! I've uploaded the project requirements document for your review.",
    time: '10:00 AM',
    status: 'read',
    attachment: { name: 'Project_Requirements.pdf', type: 'PDF' }
  },
  {
    id: '2',
    sender: 'me',
    name: 'John Doe',
    avatar: 'JD',
    text: "Thanks Sarah! I'll take a look at it this afternoon. The timeline looks good.",
    time: '10:45 AM',
    status: 'read'
  },
  {
    id: '3',
    sender: 'other',
    name: 'Sarah Chen',
    avatar: 'SC',
    text: "Great! Also, here's the design mockups from the team.",
    time: '2:30 PM',
    status: 'read',
    attachment: { name: 'Design_Mockups.png', type: 'PNG' }
  },
  {
    id: '4',
    sender: 'me',
    name: 'John Doe',
    avatar: 'JD',
    text: 'The mockups look fantastic! I love the color scheme. Quick question - can we make the header slightly taller?',
    time: '2:50 PM',
    status: 'read'
  },
  {
    id: '5',
    sender: 'other',
    name: 'Sarah Chen',
    avatar: 'SC',
    text: "Absolutely! I'll ask the design team to adjust that. Should be ready by tomorrow morning.",
    time: '3:15 PM',
    status: 'read'
  },
  {
    id: '6',
    sender: 'me',
    name: 'John Doe',
    avatar: 'JD',
    text: "Perfect! Also, I've reviewed the budget breakdown. Everything looks within scope. 👍",
    time: '4:00 PM',
    status: 'sent'
  },
  {
    id: '7',
    sender: 'other',
    name: 'Sarah Chen',
    avatar: 'SC',
    text: "That's great news! I'll schedule a kick-off meeting for next week. Does Tuesday at 2pm work for you?",
    time: '4:30 PM',
    status: 'sent'
  }
];

const DEMO_REFERENCES = [
  { id: '1', name: 'Project_Requirements.pdf' },
  { id: '2', name: 'Design_Mockups.png' },
  { id: '3', name: 'Contract.pdf' },
  { id: '4', name: 'Budget.xlsx' }
];

function DemoChat({ on_close }: { on_close?: () => void }) {
  const [selected_ref, set_selected_ref] = useState<string | null>(null);
  const [is_preview_expanded, set_is_preview_expanded] = useState(true);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Row 1: Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border/40 bg-card/80 backdrop-blur-md shadow-sm">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Chat with Sarah</h2>
          <p className="text-xs font-medium text-muted-foreground">Project Discussion</p>
        </div>
        {on_close && (
          <Button
            variant="ghost"
            size="icon"
            onClick={on_close}
            className="h-8 w-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <IoClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Row 2: References */}
      <div className="border-b bg-muted/30 px-3 py-2">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          References
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {DEMO_REFERENCES.map((ref) => (
            <Button
              key={ref.id}
              variant={selected_ref === ref.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => set_selected_ref(selected_ref === ref.id ? null : ref.id)}
              className="h-7 px-2.5 text-xs font-medium rounded-full"
            >
              {ref.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 3: Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Document preview - collapsible */}
        <div 
          className={`
            border-r bg-muted/20 flex-shrink-0 flex flex-col items-center justify-center text-muted-foreground
            transition-all duration-300 ease-in-out
            ${is_preview_expanded ? 'w-[280px] md:w-[320px]' : 'w-0 border-r-0'}
          `}
        >
          {is_preview_expanded && (
            <>
              <IoDocumentAttachSharp className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">Select a document to preview</p>
            </>
          )}
        </div>

        {/* Toggle button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => set_is_preview_expanded(!is_preview_expanded)}
          className={`
            absolute top-1/2 -translate-y-1/2 z-10
            h-8 w-6 rounded-r-md rounded-l-none
            border-l-0 bg-background hover:bg-accent
            transition-all duration-300
            ${is_preview_expanded ? 'left-[280px] md:left-[320px]' : 'left-0'}
          `}
          aria-label={is_preview_expanded ? 'Collapse preview' : 'Expand preview'}
        >
          {is_preview_expanded ? (
            <IoChevronBack className="h-4 w-4" />
          ) : (
            <IoChevronForward className="h-4 w-4" />
          )}
        </Button>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {DEMO_MESSAGES.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                msg.sender === 'me' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {msg.avatar}
              </div>

              {/* Message bubble */}
              <div className={`max-w-[70%] flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                {msg.sender === 'other' && (
                  <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.name}</span>
                )}
                <div className={`rounded-2xl px-4 py-2 ${
                  msg.sender === 'me'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  {msg.attachment && (
                    <div className="mt-2 pt-2 border-t border-current/10">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                        <IoDocumentAttachSharp className="h-3 w-3" />
                        {msg.attachment.name}
                      </Button>
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-muted-foreground">{msg.time}</span>
                  {msg.sender === 'me' && (
                    msg.status === 'read' 
                      ? <IoCheckmarkDoneSharp className="h-3 w-3 text-green-500" />
                      : <IoCheckmarkOutline className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Input */}
      <div className="border-t bg-background p-3">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-foreground">
            <IoAttach className="h-8 w-8" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-foreground">
            <IoImageOutline className="h-8 w-8" />
          </Button>
          <div className="flex-1">
            <textarea
              placeholder="Type a message..."
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[40px] max-h-[120px]"
              rows={1}
            />
          </div>
          <Button size="icon" className="h-10 w-10">
            <IoSend className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Page Component
// ============================================================================

export default function HazoChatTestPage() {
  const [is_sheet_open, set_is_sheet_open] = useState(false);
  const [is_dialog_open, set_is_dialog_open] = useState(false);
  const [current_view, set_current_view] = useState<'embedded' | 'sheet' | 'dialog'>('embedded');

  const handle_close = useCallback(() => {
    set_is_sheet_open(false);
    set_is_dialog_open(false);
    set_current_view('embedded');
  }, []);

  return (
    <main className="cls_test_page min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="cls_page_header border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                hazo_chat
              </h1>
              <p className="text-sm text-muted-foreground">
                Chat component with document viewing and real-time messaging
              </p>
            </div>
            
            {/* View Toggle Buttons */}
            <div className="cls_view_toggles flex items-center gap-2">
              <Button
                variant={current_view === 'embedded' ? 'default' : 'outline'}
                size="sm"
                onClick={() => set_current_view('embedded')}
                className="gap-2"
              >
                <IoLayers className="h-4 w-4" />
                Embedded
              </Button>
              
              <Sheet open={is_sheet_open} onOpenChange={set_is_sheet_open}>
                <SheetTrigger asChild>
                  <Button
                    variant={current_view === 'sheet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set_current_view('sheet')}
                    className="gap-2"
                  >
                    <IoChatbubbleEllipses className="h-4 w-4" />
                    Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl p-0">
                  <div className="h-full">
                    <DemoChat on_close={() => set_is_sheet_open(false)} />
                  </div>
                </SheetContent>
              </Sheet>

              <Dialog open={is_dialog_open} onOpenChange={set_is_dialog_open}>
                <DialogTrigger asChild>
                  <Button
                    variant={current_view === 'dialog' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set_current_view('dialog')}
                    className="gap-2"
                  >
                    <IoExpand className="h-4 w-4" />
                    Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
                  <DemoChat on_close={() => set_is_dialog_open(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Container - Embedded View */}
          <div className="lg:col-span-2">
            <div className="cls_chat_container bg-white dark:bg-slate-900 rounded-xl shadow-lg border overflow-hidden h-[700px]">
              <DemoChat on_close={handle_close} />
            </div>
          </div>

          {/* Features Panel */}
          <div className="cls_features_panel space-y-4">
            {/* Reference Types Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <IoDocumentAttachSharp className="h-4 w-4 text-primary" />
                Reference Types
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <code className="text-xs bg-muted px-1 rounded">document</code>
                  - PDF, images, files
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <code className="text-xs bg-muted px-1 rounded">field</code>
                  - Form field references
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <code className="text-xs bg-muted px-1 rounded">url</code>
                  - External links
                </li>
              </ul>
            </div>

            {/* Scope Indicators Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Scope Indicators
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    chat
                  </span>
                  - Document attached in chat
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    field
                  </span>
                  - Field/form reference
                </li>
              </ul>
            </div>

            {/* Message Status Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Message Status
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <IoCheckmarkOutline className="h-4 w-4 text-gray-400" />
                  Sent (grey single check)
                </li>
                <li className="flex items-center gap-2">
                  <IoCheckmarkDoneSharp className="h-4 w-4 text-green-500" />
                  Read (green double check)
                </li>
              </ul>
            </div>

            {/* Features List Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Features
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>✓ Grid layout with sidebar</li>
                <li>✓ Document viewer (PDF, images)</li>
                <li>✓ Reference list with icons</li>
                <li>✓ Chat bubbles with avatars</li>
                <li>✓ Timestamps with timezone</li>
                <li>✓ Read receipts</li>
                <li>✓ File drag-and-drop</li>
                <li>✓ Responsive design</li>
                <li>✓ Sheet/Dialog modes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
