# hazo_chat

A React chat interface component library for 1-1 communication.

## Installation

```bash
npm install hazo_chat
```

## Usage

```tsx
import { ChatContainer, MessageBubble, ChatInput } from 'hazo_chat';

function MyChatApp() {
  const handleSend = (message: string) => {
    console.log('Sending:', message);
  };

  return (
    <ChatContainer className="h-[600px]">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageBubble 
          message="Hello!" 
          is_sender={false} 
          sender_name="John"
          timestamp={new Date()}
        />
        <MessageBubble 
          message="Hi there!" 
          is_sender={true}
          timestamp={new Date()}
        />
      </div>
      <ChatInput on_send={handleSend} placeholder="Type your message..." />
    </ChatContainer>
  );
}
```

## Components

### ChatContainer

Main wrapper component for the chat interface.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Child components |
| `className` | `string` | - | Additional CSS classes |
| `aria_label` | `string` | `'Chat conversation'` | Accessibility label |

### MessageBubble

Displays a single chat message.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | - | Message content (required) |
| `is_sender` | `boolean` | `false` | Whether current user sent this |
| `timestamp` | `string \| Date` | - | Message timestamp |
| `avatar_url` | `string` | - | Avatar image URL |
| `sender_name` | `string` | - | Sender's display name |
| `className` | `string` | - | Additional CSS classes |

### ChatInput

Input field for composing messages.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `on_send` | `(message: string) => void` | - | Send callback (required) |
| `placeholder` | `string` | `'Type a message...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable input |
| `max_length` | `number` | `1000` | Max character count |
| `className` | `string` | - | Additional CSS classes |

## Configuration

Create a `hazo_chat_config.ini` file in your project root:

```ini
[chat]
max_message_length = 1000
enable_timestamps = true
enable_avatars = true
date_format = short
```

## Development

### Building

```bash
npm run build
```

### Development with test app

```bash
# Run package in watch mode
npm run dev:package

# In another terminal, run the test app
npm run dev:test-app
```

## License

MIT

