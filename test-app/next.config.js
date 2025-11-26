/**
 * Next.js Configuration for test-app
 * 
 * This configuration includes special webpack settings for workspace
 * dependency resolution with the hazo_chat package.
 */

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the workspace package for proper ES module handling
  transpilePackages: ['hazo_chat'],

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

    return config;
  },

  // Experimental features for better module handling
  experimental: {
    // Enable external directory support for workspace packages
    externalDir: true,
  },
};

module.exports = nextConfig;

