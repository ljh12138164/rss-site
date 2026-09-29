import { NextResponse } from 'next/server'
import {
  getChunkSitemapEntries,
  getSignalArticlesCount,
  renderUrlSetXml,
  SITEMAP_CACHE_CONTROL,
  SITEMAP_CHUNK_SIZE
} from '../../../lib/sitemap-service'

export const revalidate = 7200

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  if (!process.env.SITE_URL) return new NextResponse('Not Found', { status: 404 })

  const { id } = await props.params
  const cleanId = id.endsWith('.xml') ? id.slice(0, -4) : id
  const chunkIndex = Number.parseInt(cleanId, 10)

  if (Number.isNaN(chunkIndex) || chunkIndex < 0) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const articleCount = await getSignalArticlesCount()
  const totalChunks = Math.max(1, Math.ceil(articleCount / SITEMAP_CHUNK_SIZE))

  if (chunkIndex >= totalChunks && chunkIndex !== 0) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const entries = await getChunkSitemapEntries(chunkIndex)
  return new NextResponse(renderUrlSetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': SITEMAP_CACHE_CONTROL
    }
  })
}
