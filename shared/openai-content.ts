// Strips legacy CMS template tags (e.g. CCTV / Imperial CMS video player placeholders).
export function cleanCmsTemplateTags(text: string): string {
  if (!text?.includes('[!--')) return text
  return text
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
