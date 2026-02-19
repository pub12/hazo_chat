/**
 * file_description: My Settings page using hazo_auth zero-config server component
 * Uses new hazo_auth/pages/my_settings for simplified setup
 */

export const dynamic = "force-dynamic";

// section: imports
import { MySettingsPage } from "hazo_auth/pages/my_settings";

// section: component
export default function Page() {
  return <MySettingsPage />;
}







