import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lesson/skill-tree content is read from disk at runtime — make sure the
  // `content/` folder is traced into every serverless function on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;
