# Design: 403 Polling Loop Fix

## Problem

When `useChatMessages` polls GET `/api/hazo_chat/messages` and the user isn't a member of the chat group, the server returns 403 repeatedly. The hook treats all errors identically — retrying with exponential backoff — so permission errors cause 3 futile retries, console noise, and a generic `'error'` status that gives consumers no way to distinguish "no access" from "network failure."

## Solution: ChatApiError with HTTP status propagation

### New: `ChatApiError` class (internal to hook file)

Carries `status` (number) and `error_code` (string) from the HTTP response. Thrown by `fetch_messages_from_api` instead of a bare `Error("HTTP 403")`.

### New: `ErrorInfo` type + `error_info` return value

```typescript
export interface ErrorInfo { code: string; message: string; }
```

Added to `UseChatMessagesReturn` as `error_info: ErrorInfo | null`.

### New: `'forbidden'` polling status

`PollingStatus` becomes `'connected' | 'reconnecting' | 'error' | 'forbidden'`.

### Behavior changes

1. **`fetch_messages_from_api`**: On non-OK response, parses the JSON body for `error_code` and throws `ChatApiError(status, message, error_code)`.
2. **`load_initial` catch**: Checks `is_permission_error(err)`. If true, sets `polling_status='forbidden'`, `error_info={code, message}`, `error='Access denied'`. No retry.
3. **`schedule_next_poll` catch**: Checks `is_permission_error(err)`. If true, sets forbidden status and stops polling (no `schedule_next_poll` call). Otherwise, existing retry logic.
4. **Server-side**: `logger.error` -> `logger.warn` for membership check failures in GET and POST handlers (expected condition, not application error).

### Files changed

| File | Change |
|------|--------|
| `src/hooks/use_chat_messages.ts` | ChatApiError, error_info state, permission check, updated fetch/catch/return |
| `src/types/index.ts` | `'forbidden'` in PollingStatus, ErrorInfo type, error_info in UseChatMessagesReturn |
| `src/api/messages.ts` | `logger.error` -> `logger.warn` for membership checks (2 locations) |

### Non-breaking

- `error_info` starts as `null` — existing consumers unaffected
- `'forbidden'` is additive to `PollingStatus` — existing switch/if falls through to default
