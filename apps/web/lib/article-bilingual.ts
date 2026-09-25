export interface BilingualPair {
  id: string
  original: string
  translated: string
}

/**
 * Splits sanitized HTML into top-level blocks and pairs each original block
 * with its corresponding translated block for interleaved bilingual reading.
 */
export function pairBilingualBlocks(originalHtml: string, translatedHtml: string): BilingualPair[] {
  const trimmedOrig = originalHtml.trim()
  const trimmedTrans = translatedHtml.trim()

  if (!trimmedOrig && !trimmedTrans) return []
  if (!trimmedOrig) return [{ id: 'pair-0', original: '', translated: trimmedTrans }]
  if (!trimmedTrans) return [{ id: 'pair-0', original: trimmedOrig, translated: '' }]

  // Match top-level HTML element blocks
  const blockRegex = /<([a-z0-9]+)(?:\s+[^>]*)?>[\s\S]*?<\/\1>|<(?:hr|br)\s*\/?>/gi
  const origBlocks = trimmedOrig.match(blockRegex)
  const transBlocks = trimmedTrans.match(blockRegex)

  if (!origBlocks || !transBlocks) {
    return [{ id: 'pair-0', original: trimmedOrig, translated: trimmedTrans }]
  }

  const maxLen = Math.max(origBlocks.length, transBlocks.length)
  const pairs: BilingualPair[] = []

  for (let i = 0; i < maxLen; i++) {
    pairs.push({
      id: `pair-${i}`,
      original: origBlocks[i] ?? '',
      translated: transBlocks[i] ?? ''
    })
  }

  return pairs
}
