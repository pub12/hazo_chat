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
    config.resolve.alias = {
      ...config.resolve.alias,
      'hazo_chat': path.resolve(__dirname, '..'),
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

    // CRITICAL: Exclude sql.js from webpack bundling for API routes
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("sql.js");
      } else {
        config.externals = [config.externals, "sql.js"];
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
    // Exclude sql.js from server component bundling
    serverComponentsExternalPackages: [
      "sql.js",
      "better-sqlite3",
    ],
  },
};

module.exports = nextConfig;

