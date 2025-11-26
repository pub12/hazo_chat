/**
 * HazoChat components barrel export file
 * 
 * Exports all HazoChat components from the hazo_chat package.
 * All export paths use explicit .js extensions for ES module compatibility.
 */

// Main component
export { HazoChat } from './hazo_chat.js';

// Context
export { HazoChatProvider, useHazoChatContext } from './hazo_chat_context.js';

// Sub-components (for custom layouts)
export { HazoChatHeader } from './hazo_chat_header.js';
export { HazoChatSidebar } from './hazo_chat_sidebar.js';
export { HazoChatReferenceList } from './hazo_chat_reference_list.js';
export { HazoChatDocumentViewer } from './hazo_chat_document_viewer.js';
export { HazoChatMessages } from './hazo_chat_messages.js';
export { HazoChatInput } from './hazo_chat_input.js';
export { HazoChatAttachmentPreview } from './hazo_chat_attachment_preview.js';

