/** @type {import('next').NextConfig} */
const nextConfig = {
  // Since we're using Next.js 14, use experimental config
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"]
  }
}

module.exports = nextConfig 