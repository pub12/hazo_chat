/**
 * file_description: Register page using hazo_auth zero-config server component
 * Uses new hazo_auth/pages/register for simplified setup
 */

export const dynamic = "force-dynamic";

// section: imports
import { RegisterPage } from "hazo_auth/pages/register";

// section: component
export default function Page() {
  return <RegisterPage />;
}







