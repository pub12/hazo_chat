/**
 * Next.js Configuration for test-app
 * 
 * This configuration includes special webpack settings for workspace
 * dependency resolution with the hazo_chat package.
 */

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the workspace packages for proper ES module handling
  transpilePackages: ['hazo_chat', 'hazo_connect', 'hazo_auth'],


  // Custom webpack configuration for workspace resolution
  webpack: (config, { isServer }) => {
    const hazoAuthPath = path.resolve(__dirname, '..', 'node_modules', 'hazo_auth');
    
    // Add alias for the hazo_chat package pointing to parent directory
    // Add aliases for hazo_auth to import ProfilePicMenu directly without pulling in server-side code
    config.resolve.alias = {
      ...config.resolve.alias,
      'hazo_chat': path.resolve(__dirname, '..'),
      'hazo_auth/components/layouts/shared/components/profile_pic_menu': path.join(hazoAuthPath, 'dist/components/layouts/shared/components/profile_pic_menu.js'),
      'hazo_auth/components/layouts/shared/hooks/use_auth_status': path.join(hazoAuthPath, 'dist/components/layouts/shared/hooks/use_auth_status.js'),
      'hazo_auth/components/layouts/shared/data/layout_data_client': path.join(hazoAuthPath, 'dist/components/layouts/shared/data/layout_data_client.js'),
      'hazo_auth/lib/hazo_connect_setup': path.join(hazoAuthPath, 'dist/lib/hazo_connect_setup.js'),
      'hazo_auth/lib/app_logger': path.join(hazoAuthPath, 'dist/lib/app_logger.js'),
      'hazo_auth/lib/login_config.server': path.join(hazoAuthPath, 'dist/lib/login_config.server.js'),
      'hazo_auth/lib/register_config.server': path.join(hazoAuthPath, 'dist/lib/register_config.server.js'),
      'hazo_auth/lib/hazo_connect_instance.server': path.join(hazoAuthPath, 'dist/lib/hazo_connect_instance.server.js'),
      'hazo_auth/lib/services/registration_service': path.join(hazoAuthPath, 'dist/lib/services/registration_service.js'),
      'hazo_auth/lib/services/login_service': path.join(hazoAuthPath, 'dist/lib/services/login_service.js'),
      'hazo_auth/lib/services/email_verification_service': path.join(hazoAuthPath, 'dist/lib/services/email_verification_service.js'),
      'hazo_auth/lib/services/password_reset_service': path.join(hazoAuthPath, 'dist/lib/services/password_reset_service.js'),
      'hazo_auth/lib/my_settings_config.server': path.join(hazoAuthPath, 'dist/lib/my_settings_config.server.js'),
      'hazo_auth/lib/services/user_update_service': path.join(hazoAuthPath, 'dist/lib/services/user_update_service.js'),
      'hazo_auth/lib/services/password_change_service': path.join(hazoAuthPath, 'dist/lib/services/password_change_service.js'),
      'hazo_auth/lib/services/profile_picture_service': path.join(hazoAuthPath, 'dist/lib/services/profile_picture_service.js'),
      'hazo_auth/lib/services/profile_picture_remove_service': path.join(hazoAuthPath, 'dist/lib/services/profile_picture_remove_service.js'),
      'hazo_auth/components/layouts/shared/utils/ip_address': path.join(hazoAuthPath, 'dist/components/layouts/shared/utils/ip_address.js'),
    };

    // Configure module resolution to check parent node_modules
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '..', 'node_modules'),
      'node_modules',
    ];

    // Ensure proper handling of ES modules
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };

    // Enable package exports resolution
    config.resolve.conditionNames = ['import', 'require', 'default'];

    // CRITICAL: Exclude sql.js, winston, and server-only modules from webpack bundling
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("sql.js");
        config.externals.push("hazo_notify");
        config.externals.push("winston");
        config.externals.push("winston-daily-rotate-file");
      } else {
        config.externals = [config.externals, "sql.js", "hazo_notify", "winston", "winston-daily-rotate-file"];
      }
    } else {
      // For client bundles, mark server-only modules as external
      config.resolve.alias = {
        ...config.resolve.alias,
        'hazo_auth/lib/config/config_loader.server': false,
        'hazo_auth/lib/ui_shell_config.server': false,
      };
    }

    // Enable WebAssembly support for sql.js
    config.experiments = {
      ...(config.experiments ?? {}),
      asyncWebAssembly: true,
    };

    return config;
  },

  // Experimental features for better module handling
  experimental: {
    // Enable external directory support for workspace packages
    externalDir: true,
    // Exclude sql.js, hazo_notify, and winston from server component bundling
    serverComponentsExternalPackages: [
      "sql.js",
      "better-sqlite3",
      "hazo_notify",
      "winston",
      "winston-daily-rotate-file",
    ],
  },
};

module.exports = nextConfig;

