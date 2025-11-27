/**
 * file_description: Register page using hazo_auth RegisterLayout component
 * Uses hazo_auth register layout with proper authentication flow
 */

// section: imports
import { AuthPageShell } from "hazo_auth/components/layouts/shared";
import { RegisterPageClient } from "./register_page_client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_register_config } from "hazo_auth/lib/register_config.server";

// section: component
export default function RegisterPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Read register configuration from hazo_auth_config.ini (server-side)
  const registerConfig = get_register_config();

  // Get url_on_logon from query params (if any)
  const urlOnLogon = typeof searchParams.url_on_logon === "string" ? searchParams.url_on_logon : undefined;

  return (
    <AuthPageShell>
      <RegisterPageClient
        showNameField={registerConfig.showNameField}
        passwordRequirements={registerConfig.passwordRequirements}
        alreadyLoggedInMessage={registerConfig.alreadyLoggedInMessage}
        showLogoutButton={registerConfig.showLogoutButton}
        showReturnHomeButton={registerConfig.showReturnHomeButton}
        returnHomeButtonLabel={registerConfig.returnHomeButtonLabel}
        returnHomePath={registerConfig.returnHomePath}
        signInPath={registerConfig.signInPath}
        signInLabel={registerConfig.signInLabel}
        urlOnLogon={urlOnLogon}
      />
    </AuthPageShell>
  );
}

