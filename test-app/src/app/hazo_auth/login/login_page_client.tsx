/**
 * file_description: Client component for login page that initializes hazo_connect and renders login layout
 */

"use client";

// section: imports
import { useEffect, useState } from "react";
import LoginLayout from "hazo_auth/components/layouts/login";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { createLayoutDataClient } from "hazo_auth/components/layouts/shared/data/layout_data_client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_sqlite_hazo_connect } from "hazo_auth/lib/hazo_connect_setup";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_app_logger } from "hazo_auth/lib/app_logger";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import type { LayoutDataClient } from "hazo_auth/components/layouts/shared/data/layout_data_client";

// section: types
type LoginPageClientProps = {
  redirectRoute?: string;
  successMessage?: string;
  alreadyLoggedInMessage?: string;
  showLogoutButton?: boolean;
  showReturnHomeButton?: boolean;
  returnHomeButtonLabel?: string;
  returnHomePath?: string;
  forgotPasswordPath?: string;
  forgotPasswordLabel?: string;
  createAccountPath?: string;
  createAccountLabel?: string;
  urlOnLogon?: string;
};

// section: component
export function LoginPageClient({
  redirectRoute,
  successMessage,
  alreadyLoggedInMessage,
  showLogoutButton,
  showReturnHomeButton,
  returnHomeButtonLabel,
  returnHomePath,
  forgotPasswordPath,
  forgotPasswordLabel,
  createAccountPath,
  createAccountLabel,
  urlOnLogon,
}: LoginPageClientProps) {
  const [dataClient, setDataClient] = useState<LayoutDataClient<unknown> | null>(null);
  const [logger, setLogger] = useState<ReturnType<typeof create_app_logger> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize hazo_connect and logger on client side
    const hazoConnect = create_sqlite_hazo_connect();
    const client = createLayoutDataClient(hazoConnect);
    const appLogger = create_app_logger();
    
    setDataClient(client);
    setLogger(appLogger);
    setMounted(true);
  }, []);

  // Return null on server to avoid hydration mismatch
  // Only render after component mounts on client
  if (!mounted) {
    return null;
  }

  // Show loading state while initializing (only after mount)
  if (!dataClient || !logger) {
    return (
      <div className="cls_login_page_loading min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
      </div>
    );
  }

  return (
    <LoginLayout
      image_src="/globe.svg"
      image_alt="Illustration of a globe representing secure authentication workflows"
      image_background_color="#e2e8f0"
      data_client={dataClient}
      logger={logger}
      redirectRoute={redirectRoute}
      successMessage={successMessage}
      alreadyLoggedInMessage={alreadyLoggedInMessage}
      showLogoutButton={showLogoutButton}
      showReturnHomeButton={showReturnHomeButton}
      returnHomeButtonLabel={returnHomeButtonLabel}
      returnHomePath={returnHomePath}
      forgot_password_path={forgotPasswordPath}
      forgot_password_label={forgotPasswordLabel}
      create_account_path={createAccountPath}
      create_account_label={createAccountLabel}
      urlOnLogon={urlOnLogon}
    />
  );
}

