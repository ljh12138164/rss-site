import { readFile } from 'node:fs/promises'
import { cache } from 'react'
import { type SkillDetail, validSkillId } from '../../../shared/skills'
import { getPublicSupabaseClient } from './supabase'

export interface StoredSkill extends SkillDetail {
  firstSeenAt: string
  contentSyncedAt: string | null
  lastSeenAt: string
}

export const readSkillsPreview = cache(async () => {
  if (process.env.NODE_ENV !== 'development') return null
  try {
    return JSON.parse(await readFile(`${process.cwd()}/.skills-preview.json`, 'utf8')) as {
      details: StoredSkill[]
      items: {
        source: string
        source_key: string
        title: string
        url: string
        summary: string
        author: string
        published_at: null
        position: number
      }[]
      statuses: { source: string; item_count: number; last_success_at: string }[]
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
})

export const getSkillDetail = cache(async (id: string): Promise<StoredSkill | null> => {
  if (!validSkillId(id)) return null
  const preview = await readSkillsPreview()
  if (preview) return preview.details.find((item) => item.skillId === id) ?? null
  const { data, error } = await getPublicSupabaseClient()
    .from('skill_details')
    .select('*')
    .eq('skill_id', id)
    .maybeSingle()
  if (error) throw new Error('Unable to load Skill details')
  if (!data) return null
  return {
    skillId: data.skill_id,
    name: data.name,
    source: data.source,
    sourceType: data.source_type,
    upstreamUrl: data.upstream_url,
    installUrl: data.install_url,
    description: data.description,
    skillMarkdown: data.skill_markdown,
    contentHtml: data.content_html,
    totalInstalls: data.total_installs,
    contentHash: data.content_hash,
    detailState: data.detail_state,
    firstSeenAt: data.first_seen_at,
    lastSeenAt: data.last_seen_at,
    contentSyncedAt: data.content_synced_at
  }
})

export async function getRelatedSkills(source: string, id: string) {
  const preview = await readSkillsPreview()
  if (preview)
    return preview.details
      .filter((item) => item.source === source && item.skillId !== id)
      .slice(0, 4)
  const { data, error } = await getPublicSupabaseClient()
    .from('skill_details')
    .select('skill_id,name')
    .eq('source', source)
    .neq('skill_id', id)
    .order('name')
    .limit(4)
  if (error) return []
  return (data ?? []).map((item) => ({
    skillId: item.skill_id as string,
    name: item.name as string
  }))
}
