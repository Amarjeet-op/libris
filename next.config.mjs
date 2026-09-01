process.env.NEXT_DISABLE_DEVTOOLS = "1";
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Fix for Next 15 devtools RSC bug: "Could not find the module ...SegmentViewNode in the React Client Manifest"
  // See https://github.com/vercel/next.js/issues/78299
  devIndicators: false,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
