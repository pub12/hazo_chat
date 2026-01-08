# Changelog

All notable changes to hazo_chat will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.4] - 2026-01-08

### Added
- `read_only` prop to HazoChat component - when set to `true`, hides the chat input for view-only mode
  - Default is `false` (users can send messages)
  - Use cases: archived conversations, non-participant viewing, audit views

### Fixed
- Removed `react` and `react-dom` from dependencies (should only be in peerDependencies)
- Removed optional flag from `hazo_logs` in peerDependenciesMeta (it's required in v4.0+)

## [4.0.3] - 2025-12-08

### Fixed
- Distribution build issues

## [4.0.2] - 2025-12-08

### Fixed
- Minor bug fixes

## [4.0.1] - 2025-12-08

### Fixed
- Configuration file path resolution

## [4.0.0] - 2025-12-08

### Added
- Mandatory logging integration with `hazo_logs` peer dependency
- `logger` prop required on HazoChat component
- `getLogger` option required on API handler factories
- Logger types re-exported from hazo_chat

### Changed
- All `console.*` calls replaced with structured logging
- `hazo_logs` changed from optional to required peer dependency

### Breaking Changes
- `logger` prop is now required on HazoChat component
- `getLogger` option is now required on `createMessagesHandler`, `createDeleteHandler`, `createMarkAsReadHandler`, and `createUnreadCountFunction`

## [3.1.0] - 2025-11-15

### Added
- Generic schema supporting multiple chat patterns
- `group_type` field on ChatGroup: 'support' | 'peer' | 'group'
- Expanded roles: 'owner', 'admin', 'member' in addition to 'client', 'staff'

### Changed
- `client_user_id` on ChatGroup is now nullable (only required for 'support' groups)

## [3.0.0] - 2025-10-01

### Added
- Group-based chat architecture
- `hazo_chat_group` and `hazo_chat_group_users` tables
- Support for multiple users in a single chat group
- Role-based access ('client' | 'staff')

### Changed
- `receiver_user_id` prop replaced with `chat_group_id`
- Messages API uses `chat_group_id` instead of `receiver_user_id`
- Unread count groups by `chat_group_id` instead of `reference_id`

### Removed
- `receiver_profile` field from ChatMessage type

### Breaking Changes
- Database schema change: `hazo_chat.receiver_user_id` replaced with `chat_group_id`
- Component prop change: `receiver_user_id` replaced with `chat_group_id`
- API parameter change: `receiver_user_id` replaced with `chat_group_id`

## [2.0.0] - 2025-08-01

### Added
- API-first architecture
- No server-side dependencies in client components
- Exportable API handler factories

### Changed
- All data access via fetch() calls to API endpoints
- Removed direct database access from client components
