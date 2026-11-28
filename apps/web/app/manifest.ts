import type { MetadataRoute } from 'next'
import { SITE_ALTERNATE_NAME, SITE_DESCRIPTION, SITE_NAME } from '../lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · ${SITE_ALTERNATE_NAME}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0e14',
    theme_color: '#0b0e14',
    lang: 'zh-CN',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      },
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon'
      }
    ]
  }
}
