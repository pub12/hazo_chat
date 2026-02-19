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
    // Add alias for the hazo_chat package pointing to parent directory
    // Force lucide-react to resolve to test-app's version (workspace root has older version)
    config.resolve.alias = {
      ...config.resolve.alias,
      'hazo_chat': path.resolve(__dirname, '..'),
      'lucide-react': path.resolve(__dirname, '..', 'node_modules', 'lucide-react'),
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
