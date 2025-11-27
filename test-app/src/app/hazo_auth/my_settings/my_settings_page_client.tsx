/**
 * file_description: Client component for my settings page
 * Renders the MySettingsLayout from hazo_auth
 */

"use client";

// section: imports
import { useEffect, useState } from "react";
import MySettingsLayout from "hazo_auth/components/layouts/my_settings";

// section: types
interface MySettingsPageClientProps {
  userFields: {
    show_name_field: boolean;
    show_email_field: boolean;
    show_password_field: boolean;
  };
  passwordRequirements: {
    minimum_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_number: boolean;
    require_special: boolean;
  };
  profilePicture: {
    allow_photo_upload: boolean;
    upload_photo_path?: string;
    max_photo_size: number;
    user_photo_default: boolean;
    user_photo_default_priority1: "gravatar" | "library";
    user_photo_default_priority2?: "library" | "gravatar";
    library_photo_path: string;
  };
  heading?: string;
  subHeading?: string;
  profilePhotoLabel?: string;
  profilePhotoRecommendation?: string;
  uploadPhotoButtonLabel?: string;
  removePhotoButtonLabel?: string;
  profileInformationLabel?: string;
  passwordLabel?: string;
  currentPasswordLabel?: string;
  newPasswordLabel?: string;
  confirmPasswordLabel?: string;
  unauthorizedMessage?: string;
  loginButtonLabel?: string;
  loginPath?: string;
  messages: {
    photo_upload_disabled_message: string;
    gravatar_setup_message: string;
    gravatar_no_account_message: string;
    library_tooltip_message: string;
  };
  uiSizes: {
    gravatar_size: number;
    profile_picture_size: number;
    tooltip_icon_size_default: number;
    tooltip_icon_size_small: number;
    library_photo_grid_columns: number;
    library_photo_preview_size: number;
    image_compression_max_dimension: number;
    upload_file_hard_limit_bytes: number;
  };
  fileTypes: {
    allowed_image_extensions: string[];
    allowed_image_mime_types: string[];
  };
}

// section: component
export function MySettingsPageClient(props: MySettingsPageClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null on server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <MySettingsLayout
      userFields={props.userFields}
      password_requirements={props.passwordRequirements}
      profilePicture={props.profilePicture}
      heading={props.heading}
      subHeading={props.subHeading}
      profilePhotoLabel={props.profilePhotoLabel}
      profilePhotoRecommendation={props.profilePhotoRecommendation}
      uploadPhotoButtonLabel={props.uploadPhotoButtonLabel}
      removePhotoButtonLabel={props.removePhotoButtonLabel}
      profileInformationLabel={props.profileInformationLabel}
      passwordLabel={props.passwordLabel}
      currentPasswordLabel={props.currentPasswordLabel}
      newPasswordLabel={props.newPasswordLabel}
      confirmPasswordLabel={props.confirmPasswordLabel}
      unauthorizedMessage={props.unauthorizedMessage}
      loginButtonLabel={props.loginButtonLabel}
      loginPath={props.loginPath}
      messages={props.messages}
      uiSizes={props.uiSizes}
      fileTypes={props.fileTypes}
    />
  );
}

