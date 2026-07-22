/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/byline.html" },
        { source: "/field-notes", destination: "/field-notes.html" },
        { source: "/studies", destination: "/studies/index.html" },
        { source: "/studies/05", destination: "/studies/study-05.html" },
        { source: "/studies/07", destination: "/studies/study-07.html" },
        {
          source: "/studies/:n(\\d{2})",
          destination: "/studies/study-:n.html",
        },
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
