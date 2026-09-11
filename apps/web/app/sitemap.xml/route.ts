import { NextResponse } from 'next/server'
import {
  getChunkSitemapEntries,
  getSignalArticlesCount,
  renderSitemapIndexXml,
  renderUrlSetXml,
  SITEMAP_CHUNK_SIZE
} from '../../lib/sitemap-service'

export const revalidate = 7200

export async function GET() {
  const articleCount = await getSignalArticlesCount()

  // 未超出限制（<= 45,000 条）：直接在 /sitemap.xml 输出全量条目
  if (articleCount <= SITEMAP_CHUNK_SIZE) {
    const entries = await getChunkSitemapEntries(0)
    return new NextResponse(renderUrlSetXml(entries), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      }
    })
  }

  // 超出限制（> 45,000 条）：自动升级为 Sitemap Index，引用各个子分片文件
  const chunkCount = Math.max(1, Math.ceil(articleCount / SITEMAP_CHUNK_SIZE))
  return new NextResponse(renderSitemapIndexXml(chunkCount), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  })
}
