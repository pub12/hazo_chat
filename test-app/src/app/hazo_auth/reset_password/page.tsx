/**
 * file_description: Reset password page using hazo_auth zero-config server component
 * Uses new hazo_auth/pages/reset_password for simplified setup
 */

export const dynamic = "force-dynamic";

// section: imports
import { ResetPasswordPage } from "hazo_auth/pages/reset_password";

// section: component
export default function Page() {
  return <ResetPasswordPage />;
}

