/**
 * file_description: API route to get current authenticated user info
 * Uses the standardized route handler from hazo_auth/server/routes
 * This ensures consistent response format across all projects with permissions included
 */

// section: route_config
export const dynamic = "force-dynamic";

// section: exports
// Use the standardized route handler from hazo_auth v1.6.4+
// This always returns the same format including: email_verified, last_logon, profile_source, permissions
export { meGET as GET } from "hazo_auth/server/routes";
