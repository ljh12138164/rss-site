import type { DailySource } from './daily-report'

// Internal transport shared with ai-base; all dates are ISO strings on the wire.
export type FrozenInput = {
  materials: (DailySource & { text: string; isExcerpt: boolean })[]
  prompt: string
  userInput: string
  hash: string
  promptVersion: string
}
export type Candidate = {
  id: string
  section: string
  source: string
  title: string
  url: string
  image_url: string | null
  summary: string | null
  content_html: string | null
  published_at: Date | null
  first_seen_at: Date
}
export type PreviousStory = { reportDate: string; title: string; summary: string }
