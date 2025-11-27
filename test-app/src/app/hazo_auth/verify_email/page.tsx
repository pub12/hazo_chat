/**
 * file_description: Email verification page using hazo_auth component
 */

// section: imports
import { Suspense } from "react";
import { AuthPageShell } from "hazo_auth/components/layouts/shared";
import { VerifyEmailPageClient } from "./verify_email_page_client";

// section: loading
function LoadingSpinner() {
  return (
    <div className="cls_verify_email_page_loading min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
    </div>
  );
}

// section: component
export default function VerifyEmailPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<LoadingSpinner />}>
        <VerifyEmailPageClient />
      </Suspense>
    </AuthPageShell>
  );
}

