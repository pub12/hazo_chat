/**
 * file_description: Login page using hazo_auth LoginLayout component
 * Uses hazo_auth login layout with proper authentication flow
 */

// section: imports
import { AuthPageShell } from "hazo_auth/components/layouts/shared";
import { LoginPageClient } from "./login_page_client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_login_config } from "hazo_auth/lib/login_config.server";

// section: component
export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Read login configuration from hazo_auth_config.ini (server-side)
  const loginConfig = get_login_config();

  // Get redirect from query params (for redirect after login)
  const redirect = typeof searchParams.redirect === "string" ? searchParams.redirect : undefined;
  
  // Use redirect from query params if provided, otherwise use config
  const redirectRoute = redirect || loginConfig.redirectRoute;

  // Get url_on_logon from query params (if any)
  const urlOnLogon = typeof searchParams.url_on_logon === "string" ? searchParams.url_on_logon : undefined;

  return (
    <AuthPageShell>
      <LoginPageClient
        redirectRoute={redirectRoute}
        successMessage={loginConfig.successMessage}
        alreadyLoggedInMessage={loginConfig.alreadyLoggedInMessage}
        showLogoutButton={loginConfig.showLogoutButton}
        showReturnHomeButton={loginConfig.showReturnHomeButton}
        returnHomeButtonLabel={loginConfig.returnHomeButtonLabel}
        returnHomePath={loginConfig.returnHomePath}
        forgotPasswordPath={loginConfig.forgotPasswordPath}
        forgotPasswordLabel={loginConfig.forgotPasswordLabel}
        createAccountPath={loginConfig.createAccountPath}
        createAccountLabel={loginConfig.createAccountLabel}
        urlOnLogon={urlOnLogon}
      />
    </AuthPageShell>
  );
}
