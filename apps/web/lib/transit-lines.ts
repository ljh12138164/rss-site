import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologySources
} from '@rss-site/signals'
import type { OutboundReturnPath } from './outbound-link'

export type TransitLineId = 'ai' | 'technology' | 'news' | 'social' | 'finance' | 'games'

export interface TransitLineMeta {
  id: TransitLineId
  path: OutboundReturnPath
  name: string
  cssVar: string
  sourceCount: number
}

export const TRANSIT_LINES: readonly TransitLineMeta[] = [
  {
    id: 'ai',
    path: '/ai',
    name: 'AI',
    cssVar: 'var(--line-ai)',
    sourceCount: aiSources.length
  },
  {
    id: 'technology',
    path: '/technology',
    name: '科技',
    cssVar: 'var(--line-tech)',
    sourceCount: technologySources.length
  },
  {
    id: 'news',
    path: '/news',
    name: '新闻',
    cssVar: 'var(--line-news)',
    sourceCount: newsSources.length
  },
  {
    id: 'social',
    path: '/social',
    name: '社交',
    cssVar: 'var(--line-social)',
    sourceCount: socialSources.length
  },
  {
    id: 'finance',
    path: '/finance',
    name: '财经',
    cssVar: 'var(--line-finance)',
    sourceCount: financeSources.length
  },
  {
    id: 'games',
    path: '/games',
    name: '游戏',
    cssVar: 'var(--line-games)',
    sourceCount: gameSources.length
  }
] as const

const lineBySection = new Map<string, TransitLineMeta>(TRANSIT_LINES.map((line) => [line.id, line]))

const lineByPath = new Map<string, TransitLineMeta>(TRANSIT_LINES.map((line) => [line.path, line]))

export function getTransitLine(sectionOrPath?: string | null): TransitLineMeta | undefined {
  if (!sectionOrPath) return undefined
  return lineBySection.get(sectionOrPath) ?? lineByPath.get(sectionOrPath)
}

export function getTransitLineColor(sectionOrPath?: string | null): string {
  return getTransitLine(sectionOrPath)?.cssVar ?? 'var(--primary)'
}
