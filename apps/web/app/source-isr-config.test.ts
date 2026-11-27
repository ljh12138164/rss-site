import { expect, it } from 'vitest'
import * as aiSourcePage from './ai/[source]/page'
import * as financeSourcePage from './finance/[source]/page'
import * as gamesSourcePage from './games/[source]/page'
import * as newsSourcePage from './news/[source]/page'
import * as socialSourcePage from './social/[source]/page'
import * as technologySourcePage from './technology/[source]/page'

const sourcePages = [
  { name: 'ai', mod: aiSourcePage, revalidate: 7200 },
  { name: 'technology', mod: technologySourcePage, revalidate: 21600 },
  { name: 'news', mod: newsSourcePage, revalidate: 21600 },
  { name: 'social', mod: socialSourcePage, revalidate: 21600 },
  { name: 'finance', mod: financeSourcePage, revalidate: 21600 },
  { name: 'games', mod: gamesSourcePage, revalidate: 21600 }
] as const

it('configures all six channel source pages for on-demand runtime ISR', () => {
  for (const entry of sourcePages) {
    expect(entry.mod.dynamic, entry.name).toBe('force-static')
    expect(entry.mod.dynamicParams, entry.name).toBe(true)
    expect(entry.mod.revalidate, entry.name).toBe(entry.revalidate)
    expect(entry.mod.generateStaticParams(), entry.name).toEqual([])
  }
})
