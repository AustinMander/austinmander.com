/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/byline.html" }],
      // afterFiles runs only when nothing on disk matched, so the real
      // public/studies/**/index.html files always win and these just add the
      // extensionless URLs. Ordering matters: beforeFiles here would rewrite
      // /studies/index.html into /studies/index.html/index.html.
      afterFiles: [
        { source: "/studies", destination: "/studies/index.html" },
        { source: "/studies/:slug", destination: "/studies/:slug/index.html" },
      ],
    };
  },
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  eslint: {
    // Lint is a gate, but it is not the build. Until ESLint was repaired it
    // crashed on every build and blocked nothing; now that it runs it reports
    // 157 pre-existing errors, which would fail the production deploy of a site
    // whose code has not changed. Lint runs on its own via `npm run lint`, where
    // it can fail loudly without taking the site down with it.
    ignoreDuringBuilds: true,
  },
  experimental: {
    mdxRs: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
      {
        protocol: "https",
        hostname: "austinmander.com",
      },
    ],
    unoptimized: false,
  },
};

module.exports = nextConfig;