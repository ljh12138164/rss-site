import { listSignalSources, type SignalSourceId } from '@rss-site/signals'
import { useSyncExternalStore } from 'react'

export const followingSources = listSignalSources({ isArticle: true })
const key = 'rss_site_following_v1'
const event = 'rss_following_change'
export interface FollowingPreferences {
  followed: SignalSourceId[]
  hidden: SignalSourceId[]
  unreadOnly: boolean
}
const empty: FollowingPreferences = { followed: [], hidden: [], unreadOnly: false }
let cached: FollowingPreferences | undefined

export function parseFollowing(value: unknown): FollowingPreferences {
  if (!value || typeof value !== 'object') return empty
  const input = value as Partial<FollowingPreferences>
  const valid = (ids: unknown) =>
    Array.isArray(ids)
      ? followingSources.filter((source) => ids.includes(source.id)).map((source) => source.id)
      : []
  const hidden = valid(input.hidden)
  return {
    followed: valid(input.followed).filter((id) => !hidden.includes(id)),
    hidden,
    unreadOnly: input.unreadOnly === true
  }
}

export function getFollowing(): FollowingPreferences {
  if (cached) return cached
  try {
    cached = parseFollowing(JSON.parse(window.localStorage.getItem(key) ?? 'null'))
  } catch {
    cached = empty
  }
  return cached
}

export function saveFollowing(preferences: FollowingPreferences): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(parseFollowing(preferences)))
    cached = undefined
    window.dispatchEvent(new Event(event))
    return true
  } catch {
    return false
  }
}

function subscribe(callback: () => void) {
  const update = () => {
    cached = undefined
    callback()
  }
  window.addEventListener(event, update)
  window.addEventListener('storage', update)
  return () => {
    window.removeEventListener(event, update)
    window.removeEventListener('storage', update)
  }
}

export function useFollowing() {
  return useSyncExternalStore(subscribe, getFollowing, () => empty)
}
