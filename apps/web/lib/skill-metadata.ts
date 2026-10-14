interface SkillMetadata {
  description: string | null
  installs: number | null
  source: string | null
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value.replace(/[,+]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function parseSkillMetadata(summary: string | null): SkillMetadata {
  if (!summary) return { description: null, installs: null, source: null }
  const parts = summary.split(' · ')
  const metadata = new Map(
    parts.slice(1).flatMap((part) => {
      const separator = part.indexOf(':')
      return separator < 0 ? [] : [[part.slice(0, separator), part.slice(separator + 1).trim()]]
    })
  )
  return {
    description: parts[0] || null,
    installs: parseNumber(metadata.get('Installs')),
    source: metadata.get('Source') ?? null
  }
}
