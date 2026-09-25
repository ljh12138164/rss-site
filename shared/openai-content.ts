// Transforms CCTV / Imperial CMS video codes into playable mount elements.
export function transformCctvVideoTags(text: string): string {
  if (!text?.includes('[!--begin:htmlVideoCode--]')) return text
  return text.replace(
    /(?:<p\b[^>]*>\s*)?\[!--begin:htmlVideoCode--\]([a-f0-9]{32})(?:,(\d+))?.*?\[!--end:htmlVideoCode--\](?:\s*<\/p>)?/gi,
    (_match, pid, type) => {
      const videoType = type ?? '0'
      return `<div data-cctv-video="${pid}" data-cctv-type="${videoType}" class="cctv-video-mount"></div>`
    }
  )
}

// Strips legacy CMS template tags while preserving playable video mounts.
export function cleanCmsTemplateTags(text: string): string {
  if (!text?.includes('[!--')) return text
  const withVideos = transformCctvVideoTags(text)
  return withVideos
    .replace(/\[!--begin:\w+--\][\s\S]*?\[!--end:\w+--\]/gi, '')
    .replace(/\[!--[\s\S]*?--\]/gi, '')
}

// RSSHub includes OpenAI's read-aloud control alongside the article body.
export function cleanOpenAiContent(html: string, url: string): string {
  try {
    if (new URL(url).hostname !== 'openai.com') return html
  } catch {
    return html
  }
  return html.replace(
    /<div\b[^>]*\bdata-read-aloud-ui\s*=\s*["']true["'][^>]*>[\s\S]*?<\/audio>\s*<\/div>/gi,
    ''
  )
}

export function cleanFeedArticleHtml(html: string, url?: string): string {
  let cleaned = cleanCmsTemplateTags(html)
  if (url) {
    cleaned = cleanOpenAiContent(cleaned, url)
  }
  return cleaned
}
