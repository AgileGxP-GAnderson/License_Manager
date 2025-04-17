let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },

  webpack: (config, { isServer }) => {
    // Handle Sequelize's dynamic imports
    if (isServer) {
      // For server-side, mark pg modules as external
      config.externals = [
        ...(config.externals || []), 
        'pg', 
        'pg-hstore'
      ];
    } else {
      // For client-side, ensure these modules are properly handled
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          pg: false,
          'pg-hstore': false,
          fs: false,
          path: false,
        }
      };
    }
    return config;
  }
}

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      nextConfig[key] = config[key]
    }
  }
}

export default nextConfig
