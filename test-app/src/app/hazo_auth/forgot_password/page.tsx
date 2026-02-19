/**
 * file_description: Forgot password page using hazo_auth zero-config server component
 * Uses new hazo_auth/pages/forgot_password for simplified setup
 */

export const dynamic = "force-dynamic";

// section: imports
import { ForgotPasswordPage } from "hazo_auth/pages/forgot_password";

// section: component
export default function Page() {
  return <ForgotPasswordPage />;
}







