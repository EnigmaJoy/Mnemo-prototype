import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Transformers.js (@xenova/transformers) imports node built-ins (fs/path/url)
  // and onnxruntime-node at module load. Webpack auto-polyfills these to `{}`
  // in browser builds; Turbopack leaves them `undefined`, so env.js crashes on
  // `Object.keys(fs)`. We alias them to a no-op CJS module.
  turbopack: {
    resolveAlias: {
      'onnxruntime-node': { browser: './empty-module.js' },
      'sharp': { browser: './empty-module.js' },
      'fs': { browser: './empty-module.js' },
      'path': { browser: './empty-module.js' },
      'url': { browser: './empty-module.js' },
    },
  },
};

export default nextConfig;
