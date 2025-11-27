/**
 * file_description: Client component for forgot password page
 */

"use client";

// section: imports
import { useEffect, useState } from "react";
import ForgotPasswordLayout from "hazo_auth/components/layouts/forgot_password";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { createLayoutDataClient } from "hazo_auth/components/layouts/shared/data/layout_data_client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { create_sqlite_hazo_connect } from "hazo_auth/lib/hazo_connect_setup";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import type { LayoutDataClient } from "hazo_auth/components/layouts/shared/data/layout_data_client";

// section: component
export function ForgotPasswordPageClient() {
  const [dataClient, setDataClient] = useState<LayoutDataClient<unknown> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hazoConnect = create_sqlite_hazo_connect();
    const client = createLayoutDataClient(hazoConnect);
    setDataClient(client);
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!dataClient) {
    return (
      <div className="cls_forgot_password_page_loading min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
      </div>
    );
  }

  return (
    <ForgotPasswordLayout
      image_src="/globe.svg"
      image_alt="Forgot password illustration"
      image_background_color="#e2e8f0"
      data_client={dataClient}
    />
  );
}

