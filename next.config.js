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