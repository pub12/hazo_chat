/**
 * file_description: HazoChat Test Page
 * 
 * Demonstrates the hazo_chat component with hardcoded demo messages.
 * Requires authentication via hazo_auth - redirects to login if not authenticated.
 */

'use client';

// section: imports
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
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
  IoCheckmarkOutline,
  IoCheckmarkDoneSharp,
  IoChevronBack,
  IoChevronForward,
  IoChevronDown,
  IoChevronUp,
  IoLinkSharp,
  IoRefresh
} from 'react-icons/io5';
import { LuTextCursorInput } from 'react-icons/lu';
// Import ProfilePicMenu and use_auth_status from hazo_auth
// Importing directly to avoid pulling in server-side code from barrel exports
// Webpack aliases resolve these paths
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { ProfilePicMenu } from 'hazo_auth/components/layouts/shared/components/profile_pic_menu';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { use_auth_status } from 'hazo_auth/components/layouts/shared/hooks/use_auth_status';
import { UserCombobox } from '@/components/user_combobox';
import { Input } from '@/components/ui/input';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { IoMailOutline } from 'react-icons/io5';

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

const DEMO_REFERENCES: Array<{ id: string; name: string; type: 'link' | 'document' | 'field' }> = [
  { id: '1', name: 'Project_Requirements.pdf', type: 'link' },
  { id: '2', name: 'Design_Mockups.png', type: 'document' },
  { id: '3', name: 'Contract.pdf', type: 'field' },
  { id: '4', name: 'Budget.xlsx', type: 'link' }
];

// section: helper_functions
// Helper to get icon for reference type
function get_ref_icon(type: 'link' | 'document' | 'field') {
  switch (type) {
    case 'document':
      return <IoDocumentAttachSharp className="h-3 w-3 opacity-50 ml-1" />;
    case 'field':
      return <LuTextCursorInput className="h-3 w-3 opacity-50 ml-1" />;
    case 'link':
    default:
      return <IoLinkSharp className="h-3 w-3 opacity-50 ml-1" />;
  }
}

// section: demo_chat_component_types
interface DemoChatProps {
  on_close?: () => void;
  receiver_user_id?: string;
  reference_id?: string;
  reference_type?: string;
}

// section: chat_message_type
interface ChatMessageFromDB {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  message_text: string;
  reference_id: string;
  reference_type: string;
  created_at: string;
  read_at: string | null;
}

// section: user_profile_type
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

// section: demo_chat_component
function DemoChat({ on_close, receiver_user_id, reference_id, reference_type }: DemoChatProps) {
  const [selected_ref, set_selected_ref] = useState<string | null>(null);
  const [is_preview_expanded, set_is_preview_expanded] = useState(false);
  const [message_text, set_message_text] = useState('');
  const [is_sending, set_is_sending] = useState(false);
  const [chat_messages, set_chat_messages] = useState<ChatMessageFromDB[]>([]);
  const [current_user_id, set_current_user_id] = useState<string>('');
  const [is_loading, set_is_loading] = useState(false);
  const [user_profiles, set_user_profiles] = useState<Map<string, UserProfile>>(new Map());
  const messages_container_ref = useRef<HTMLDivElement>(null);
  const [is_references_expanded, set_is_references_expanded] = useState(() => DEMO_REFERENCES.length > 0);

  // Fetch user profiles for current user and receiver
  useEffect(() => {
    async function fetch_profiles() {
      if (!current_user_id && !receiver_user_id) return;
      
      const user_ids_to_fetch: string[] = [];
      if (current_user_id && !user_profiles.has(current_user_id)) {
        user_ids_to_fetch.push(current_user_id);
      }
      if (receiver_user_id && !user_profiles.has(receiver_user_id)) {
        user_ids_to_fetch.push(receiver_user_id);
      }

      if (user_ids_to_fetch.length === 0) return;

      try {
        const response = await fetch('/api/hazo_auth/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: user_ids_to_fetch }),
        });
        const data = await response.json();

        if (data.success && data.profiles) {
          set_user_profiles(prev => {
            const new_map = new Map(prev);
            data.profiles.forEach((profile: UserProfile) => {
              new_map.set(profile.id, profile);
            });
            return new_map;
          });
          console.log('User profiles loaded:', data.profiles.length);
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    }

    fetch_profiles();
  }, [current_user_id, receiver_user_id, user_profiles]);

  // Fetch chat history function (extracted for manual refresh)
  const fetch_chat_history = useCallback(async () => {
    if (!receiver_user_id) {
      set_chat_messages([]);
      return;
    }

    set_is_loading(true);
    try {
      const params = new URLSearchParams({
        receiver_user_id,
        ...(reference_id && { reference_id }),
        ...(reference_type && { reference_type }),
      });

      const response = await fetch(`/api/hazo_chat/messages?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        set_chat_messages(data.messages || []);
        set_current_user_id(data.current_user_id || '');
        console.log('Chat history loaded:', data.messages?.length || 0, 'messages');
        
        // Scroll to bottom after refresh
        setTimeout(() => {
          if (messages_container_ref.current) {
            messages_container_ref.current.scrollTop = messages_container_ref.current.scrollHeight;
          }
        }, 150);
      } else {
        console.error('Failed to fetch chat history:', data.error);
        set_chat_messages([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      set_chat_messages([]);
    } finally {
      set_is_loading(false);
    }
  }, [receiver_user_id, reference_id, reference_type]);

  // Fetch chat history on mount or when props change
  useEffect(() => {
    fetch_chat_history();
  }, [fetch_chat_history]);

  // Auto-scroll to bottom when messages change (handles polling, new messages)
  // Note: Refresh button also has explicit scroll in fetch_chat_history
  useEffect(() => {
    if (messages_container_ref.current && chat_messages.length > 0 && !is_loading) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (messages_container_ref.current) {
          messages_container_ref.current.scrollTop = messages_container_ref.current.scrollHeight;
        }
      }, 100);
    }
  }, [chat_messages.length, is_loading]);

  // Helper function to get initials from name
  const get_initials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle sending message
  const handle_send_message = async () => {
    if (!message_text.trim() || is_sending) return;
    
    if (!receiver_user_id) {
      alert('Please select a user to chat with');
      return;
    }

    set_is_sending(true);
    
    try {
      const response = await fetch('/api/hazo_chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_user_id,
          message_text: message_text.trim(),
          reference_id,
          reference_type,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add to chat messages for display
        const new_message: ChatMessageFromDB = {
          id: data.message.id,
          sender_user_id: data.message.sender_user_id,
          receiver_user_id: data.message.receiver_user_id,
          message_text: data.message.message_text,
          reference_id: data.message.reference_id,
          reference_type: data.message.reference_type,
          created_at: data.message.created_at,
          read_at: null,
        };
        set_chat_messages(prev => [...prev, new_message]);
        set_message_text('');
        console.log('Message sent successfully:', data.message);
        
        // Scroll to bottom after message is sent
        setTimeout(() => {
          if (messages_container_ref.current) {
            messages_container_ref.current.scrollTop = messages_container_ref.current.scrollHeight;
          }
        }, 100);
      } else {
        console.error('Failed to send message:', data.error);
        alert(`Failed to send message: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      set_is_sending(false);
    }
  };

  // Handle Enter key press
  const handle_key_press = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handle_send_message();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Row 1: Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border/40 bg-card/80 backdrop-blur-md shadow-sm">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Chat with Sarah</h2>
          <p className="text-xs font-medium text-muted-foreground">Project Discussion</p>
        </div>
        <div className="flex items-center gap-1">
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={fetch_chat_history}
            disabled={is_loading}
            className="h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Refresh chat history"
          >
            <IoRefresh className={`h-4 w-4 ${is_loading ? 'animate-spin' : ''}`} />
          </Button>
          {/* Close button */}
          {on_close && (
            <Button
              variant="ghost"
              size="icon"
              onClick={on_close}
              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Close chat"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: References - collapsible */}
      <div className={cn(
        'border-b bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden',
        is_references_expanded ? 'max-h-96' : 'max-h-8'
      )}>
        <div className="px-3 py-2">
          <button
            onClick={() => set_is_references_expanded(!is_references_expanded)}
            className="flex items-center justify-between w-full gap-2 mb-1.5 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
            aria-label={is_references_expanded ? 'Collapse references' : 'Expand references'}
            aria-expanded={is_references_expanded}
          >
            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              References
            </h3>
            {is_references_expanded ? (
              <IoChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <IoChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {is_references_expanded && (
            <div className="flex flex-wrap items-center gap-1.5">
              {DEMO_REFERENCES.map((ref) => (
                <Button
                  key={ref.id}
                  variant={selected_ref === ref.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => set_selected_ref(selected_ref === ref.id ? null : ref.id)}
                  className="h-7 px-2.5 text-xs font-medium rounded-full flex items-center"
                  aria-label={`Reference: ${ref.name}`}
                >
                  {ref.name}
                  {get_ref_icon(ref.type)}
                </Button>
              ))}
            </div>
          )}
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
        <div 
          ref={messages_container_ref}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Loading state */}
          {is_loading && (
            <div className="flex items-center justify-center h-full">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
            </div>
          )}

          {/* No receiver selected */}
          {!is_loading && !receiver_user_id && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a user to start chatting
            </div>
          )}

          {/* No messages yet */}
          {!is_loading && receiver_user_id && chat_messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No messages yet. Start the conversation!
            </div>
          )}

          {/* Chat messages from database */}
          {!is_loading && chat_messages.map((msg) => {
            const is_me = msg.sender_user_id === current_user_id;
            const msg_time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            });
            const sender_profile = user_profiles.get(msg.sender_user_id);
            const avatar_url = sender_profile?.avatar_url;
            const sender_name = sender_profile?.name || (is_me ? 'Me' : 'User');
            const initials = get_initials(sender_name);
            
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${is_me ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar with HoverCard */}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                      {avatar_url ? (
                        <img
                          src={avatar_url}
                          alt={`${sender_name}'s profile picture`}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${
                          is_me 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {initials}
                        </div>
                      )}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72" side={is_me ? 'left' : 'right'} align="start">
                    <div className="flex gap-4">
                      {/* Larger profile picture */}
                      {avatar_url ? (
                        <img
                          src={avatar_url}
                          alt={`${sender_name}'s profile picture`}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold flex-shrink-0 ${
                          is_me 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {initials}
                        </div>
                      )}
                      {/* User info */}
                      <div className="flex flex-col justify-center gap-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{sender_name}</h4>
                        {sender_profile?.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IoMailOutline className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{sender_profile.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                {/* Message bubble */}
                <div className={`max-w-[70%] flex flex-col ${is_me ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    is_me
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${is_me ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-muted-foreground">{msg_time}</span>
                    {is_me && (
                      msg.read_at 
                        ? <IoCheckmarkDoneSharp className="h-3 w-3 text-green-500" />
                        : <IoCheckmarkOutline className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 4: Input */}
      <div className="border-t bg-background p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <textarea
            placeholder="Type a message..."
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[40px] max-h-[120px]"
            rows={1}
            aria-label="Message input"
            value={message_text}
            onChange={(e) => set_message_text(e.target.value)}
            onKeyPress={handle_key_press}
            disabled={is_sending}
          />
          <Button 
            size="icon" 
            className="cls_send_btn h-10 w-10" 
            aria-label="Send message"
            onClick={handle_send_message}
            disabled={is_sending || !message_text.trim()}
          >
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
  const router = useRouter();
  const auth_status = use_auth_status();
  const [is_sheet_open, set_is_sheet_open] = useState(false);
  const [is_dialog_open, set_is_dialog_open] = useState(false);
  const [current_view, set_current_view] = useState<'embedded' | 'sheet' | 'dialog'>('embedded');
  const [selected_user_id, set_selected_user_id] = useState<string>('');
  const [reference_id, set_reference_id] = useState<string>('');
  const [reference_type, set_reference_type] = useState<string>('chat');
  const [chat_key, set_chat_key] = useState<number>(0);

  // Refresh chat with current inputs
  const handle_refresh_chat = useCallback(() => {
    set_chat_key(prev => prev + 1);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!auth_status.loading && !auth_status.authenticated) {
      const current_path = window.location.pathname;
      router.push(`/hazo_auth/login?redirect=${encodeURIComponent(current_path)}`);
    }
  }, [auth_status.loading, auth_status.authenticated, router]);

  const handle_close = useCallback(() => {
    set_is_sheet_open(false);
    set_is_dialog_open(false);
    set_current_view('embedded');
  }, []);

  // Show loading state while checking authentication
  if (auth_status.loading) {
    return (
      <main className="cls_test_page min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="cls_loading_container flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!auth_status.authenticated) {
    return (
      <main className="cls_test_page min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="cls_redirecting_container flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </main>
    );
  }

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
            
            {/* View Toggle Buttons and Profile Menu */}
            <div className="cls_view_toggles flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={current_view === 'embedded' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => set_current_view('embedded')}
                  className="gap-2"
                  aria-label="Embedded view"
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
                      aria-label="Sheet view"
                    >
                      <IoChatbubbleEllipses className="h-4 w-4" />
                      Sheet
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-xl p-0">
                    <div className="h-full">
                      <DemoChat 
                        key={`sheet-${chat_key}`}
                        on_close={() => set_is_sheet_open(false)} 
                        receiver_user_id={selected_user_id}
                        reference_id={reference_id}
                        reference_type={reference_type}
                      />
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
                      aria-label="Dialog view"
                    >
                      <IoExpand className="h-4 w-4" />
                      Dialog
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
                    <DemoChat 
                      key={`dialog-${chat_key}`}
                      receiver_user_id={selected_user_id}
                      reference_id={reference_id}
                      reference_type={reference_type}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Profile Pic Menu */}
              <ProfilePicMenu
                login_path="/hazo_auth/login"
                register_path="/hazo_auth/register"
                settings_path="/hazo_auth/my_settings"
                logout_path="/api/hazo_auth/logout"
                className="ml-2"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Test Inputs (Testing Only) */}
        <div className="cls_user_selection mb-6 flex flex-wrap items-center gap-4">
          {/* User Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Chat with:
            </label>
            <UserCombobox
              value={selected_user_id}
              onValueChange={(userId) => set_selected_user_id(userId)}
              placeholder="Select a user to chat with..."
            />
          </div>
          
          {/* Reference ID Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Reference ID:
            </label>
            <Input
              type="text"
              value={reference_id}
              onChange={(e) => set_reference_id(e.target.value)}
              placeholder="e.g. project-123"
              className="w-40"
              aria-label="Reference ID input"
            />
          </div>
          
          {/* Reference Type Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Reference Type:
            </label>
            <Input
              type="text"
              value={reference_type}
              onChange={(e) => set_reference_type(e.target.value)}
              placeholder="e.g. chat, project"
              className="w-36"
              aria-label="Reference Type input"
            />
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handle_refresh_chat}
            className="gap-2"
            aria-label="Refresh chat with current inputs"
          >
            <IoRefresh className="h-4 w-4" />
            Refresh Chat
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Container - Embedded View */}
          <div className="lg:col-span-2">
            <div className="cls_chat_container bg-white dark:bg-slate-900 rounded-xl shadow-lg border overflow-hidden h-[700px]">
              <DemoChat 
                key={`embedded-${chat_key}`}
                on_close={handle_close}
                receiver_user_id={selected_user_id}
                reference_id={reference_id}
                reference_type={reference_type}
              />
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
