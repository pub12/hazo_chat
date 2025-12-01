/**
 * file_description: My Settings page using hazo_auth MySettingsLayout component
 * Renders user profile settings with editable fields and profile picture management
 */

// section: imports
import { AuthPageShell } from "hazo_auth/components/layouts/shared";
import { MySettingsPageClient } from "./my_settings_page_client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - webpack alias resolves this path
import { get_my_settings_config } from "hazo_auth/lib/my_settings_config.server";

// section: component
export default function MySettingsPage() {
  // Read my settings configuration from hazo_auth_config.ini (server-side)
  const config = get_my_settings_config();

  return (
    <AuthPageShell>
      <MySettingsPageClient
        userFields={config.userFields}
        passwordRequirements={config.passwordRequirements}
        profilePicture={config.profilePicture}
        heading={config.heading}
        subHeading={config.subHeading}
        profilePhotoLabel={config.profilePhotoLabel}
        profilePhotoRecommendation={config.profilePhotoRecommendation}
        uploadPhotoButtonLabel={config.uploadPhotoButtonLabel}
        removePhotoButtonLabel={config.removePhotoButtonLabel}
        profileInformationLabel={config.profileInformationLabel}
        passwordLabel={config.passwordLabel}
        currentPasswordLabel={config.currentPasswordLabel}
        newPasswordLabel={config.newPasswordLabel}
        confirmPasswordLabel={config.confirmPasswordLabel}
        unauthorizedMessage={config.unauthorizedMessage}
        loginButtonLabel={config.loginButtonLabel}
        loginPath={config.loginPath}
        messages={config.messages}
        uiSizes={config.uiSizes}
        fileTypes={config.fileTypes}
      />
    </AuthPageShell>
  );
}







