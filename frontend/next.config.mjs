import withPWAInit from "next-pwa";

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
}

// PWA Configuration
const withPWA = withPWAInit({
  dest: "public", // Destination directory for the service worker and other PWA files.
  register: true, // Register the service worker.
  skipWaiting: true, // Install the new service worker without waiting for the existing one to finish.
  disable: process.env.NODE_ENV === "development", // Disable PWA in development.
  // You might want to add runtime caching strategies here later
});

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

// Export the final config wrapped with PWA
export default withPWA(nextConfig);
