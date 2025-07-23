/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'playwright']
  },
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL,
    SMTP_URL: process.env.SMTP_URL,
  }
}

module.exports = nextConfig