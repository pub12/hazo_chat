/**
 * file_description: Login page using hazo_auth zero-config server component
 * Uses new hazo_auth/pages/login for simplified setup
 */

// section: imports
import { LoginPage } from "hazo_auth/pages/login";

// section: component
export default function Page() {
  return <LoginPage />;
}
