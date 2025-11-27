/**
 * file_description: Reset password page using hazo_auth component
 */

// section: imports
import { Suspense } from "react";
import { AuthPageShell } from "hazo_auth/components/layouts/shared";
import { ResetPasswordPageClient } from "./reset_password_page_client";

// section: loading
function LoadingSpinner() {
  return (
    <div className="cls_reset_password_page_loading min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
    </div>
  );
}

// section: component
export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<LoadingSpinner />}>
        <ResetPasswordPageClient />
      </Suspense>
    </AuthPageShell>
  );
}

