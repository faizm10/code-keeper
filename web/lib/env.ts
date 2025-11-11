'use client'

function normalizeUrl(url: string) {
  return url.replace(/\/$/, '')
}

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_FORCE_LOCALHOST_REDIRECT === 'true') {
    return 'http://localhost:3000'
  }

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local')

    if (isLocalhost) {
      return normalizeUrl(window.location.origin)
    }

    const envUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : null)

    return normalizeUrl(envUrl || window.location.origin)
  }

  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : null)

  return normalizeUrl(envUrl || 'http://localhost:3000')
}


