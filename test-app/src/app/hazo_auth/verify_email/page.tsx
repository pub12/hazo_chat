/**
 * file_description: Email verification page using hazo_auth zero-config server component
 * Uses new hazo_auth/pages/verify_email for simplified setup
 */

// section: imports
import { VerifyEmailPage } from "hazo_auth/pages/verify_email";

// section: component
export default function Page() {
  return <VerifyEmailPage />;
}

