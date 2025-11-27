/**
 * file_description: Client component for register page that initializes hazo_connect and renders register layout
 */

"use client";

// section: imports
import { useEffect, useState } from "react";
import RegisterLayout from "hazo_auth/components/layouts/register";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { createLayoutDataClient } from "hazo_auth/components/layouts/shared/data/layout_data_client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_sqlite_hazo_connect } from "hazo_auth/lib/hazo_connect_setup";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import type { LayoutDataClient } from "hazo_auth/components/layouts/shared/data/layout_data_client";

// section: types
type RegisterPageClientProps = {
  showNameField?: boolean;
  passwordRequirements?: {
    minimum_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_number: boolean;
    require_special: boolean;
  };
  alreadyLoggedInMessage?: string;
  showLogoutButton?: boolean;
  showReturnHomeButton?: boolean;
  returnHomeButtonLabel?: string;
  returnHomePath?: string;
  signInPath?: string;
  signInLabel?: string;
  urlOnLogon?: string;
};

// section: component
export function RegisterPageClient({
  showNameField,
  passwordRequirements,
  alreadyLoggedInMessage,
  showLogoutButton,
  showReturnHomeButton,
  returnHomeButtonLabel,
  returnHomePath,
  signInPath,
  signInLabel,
  urlOnLogon,
}: RegisterPageClientProps) {
  const [dataClient, setDataClient] = useState<LayoutDataClient<unknown> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize hazo_connect on client side
    const hazoConnect = create_sqlite_hazo_connect();
    const client = createLayoutDataClient(hazoConnect);
    
    setDataClient(client);
    setMounted(true);
  }, []);

  // Return null on server to avoid hydration mismatch
  // Only render after component mounts on client
  if (!mounted) {
    return null;
  }

  // Show loading state while initializing (only after mount)
  if (!dataClient) {
    return (
      <div className="cls_register_page_loading min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
      </div>
    );
  }

  return (
    <RegisterLayout
      image_src="/globe.svg"
      image_alt="Illustration of a globe representing secure authentication workflows"
      image_background_color="#e2e8f0"
      password_requirements={passwordRequirements}
      show_name_field={showNameField}
      data_client={dataClient}
      alreadyLoggedInMessage={alreadyLoggedInMessage}
      showLogoutButton={showLogoutButton}
      showReturnHomeButton={showReturnHomeButton}
      returnHomeButtonLabel={returnHomeButtonLabel}
      returnHomePath={returnHomePath}
      signInPath={signInPath}
      signInLabel={signInLabel}
      urlOnLogon={urlOnLogon}
    />
  );
}

