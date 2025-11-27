/**
 * file_description: Forgot password page using hazo_auth component
 */

// section: imports
import { AuthPageShell } from "hazo_auth/components/layouts/shared";
import { ForgotPasswordPageClient } from "./forgot_password_page_client";

// section: component
export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <ForgotPasswordPageClient />
    </AuthPageShell>
  );
}


