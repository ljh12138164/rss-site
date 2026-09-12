// RSSHub includes OpenAI's read-aloud control alongside the article body.
export function cleanOpenAiContent(html: string, url: string): string {
  if (new URL(url).hostname !== 'openai.com') return html
  return html.replace(
    /<div\b[^>]*\bdata-read-aloud-ui\s*=\s*["']true["'][^>]*>[\s\S]*?<\/audio>\s*<\/div>/gi,
    ''
  )
}
