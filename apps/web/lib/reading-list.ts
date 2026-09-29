import { useSyncExternalStore } from 'react'

export interface SavedArticleItem {
  id: string
  title: string
  url: string
  source?: string
  sourceName?: string
  section?: string
  savedAt: number
}

export interface ReadingHistoryItem {
  id: string
  title: string
  url: string
  source?: string
  sourceName?: string
  section?: string
  readAt: number
}

const READ_LATER_KEY = 'rss_site_read_later_v1'
const READING_HISTORY_KEY = 'rss_site_reading_history_v1'
export const READING_LIST_CHANGE_EVENT = 'rss_reading_list_change'
const MAX_HISTORY_ITEMS = 100

// Memory cache to ensure stable references for useSyncExternalStore
let cachedSavedArticles: SavedArticleItem[] | null = null
let cachedReadingHistory: ReadingHistoryItem[] | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeGetStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function safeSetStorage(key: string, value: unknown): boolean {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function notifySubscribers() {
  if (!isBrowser()) return
  cachedSavedArticles = null
  cachedReadingHistory = null
  window.dispatchEvent(new CustomEvent(READING_LIST_CHANGE_EVENT))
}

export function getSavedArticles(): SavedArticleItem[] {
  if (cachedSavedArticles !== null) return cachedSavedArticles
  cachedSavedArticles = safeGetStorage<SavedArticleItem[]>(READ_LATER_KEY, [])
  return cachedSavedArticles
}

export function isArticleSaved(id: string): boolean {
  if (!id) return false
  const list = getSavedArticles()
  return list.some((item) => item.id === id)
}

export function saveArticle(item: Omit<SavedArticleItem, 'savedAt'>): void {
  if (!isBrowser() || !item.id) return
  const current = getSavedArticles()
  const filtered = current.filter((x) => x.id !== item.id)
  const updated: SavedArticleItem[] = [{ ...item, savedAt: Date.now() }, ...filtered]
  safeSetStorage(READ_LATER_KEY, updated)
  notifySubscribers()
}

export function removeSavedArticle(id: string): void {
  if (!isBrowser() || !id) return
  const current = getSavedArticles()
  const updated = current.filter((x) => x.id !== id)
  safeSetStorage(READ_LATER_KEY, updated)
  notifySubscribers()
}

export function toggleSavedArticle(item: Omit<SavedArticleItem, 'savedAt'>): boolean {
  const saved = isArticleSaved(item.id)
  if (saved) {
    removeSavedArticle(item.id)
    return false
  }
  saveArticle(item)
  return true
}

export function clearSavedArticles(): void {
  if (!isBrowser()) return
  safeSetStorage(READ_LATER_KEY, [])
  notifySubscribers()
}

export function getReadingHistory(): ReadingHistoryItem[] {
  if (cachedReadingHistory !== null) return cachedReadingHistory
  cachedReadingHistory = safeGetStorage<ReadingHistoryItem[]>(READING_HISTORY_KEY, [])
  return cachedReadingHistory
}

export function isArticleRead(id: string): boolean {
  if (!id) return false
  const list = getReadingHistory()
  return list.some((item) => item.id === id)
}

export function recordReadingHistory(item: Omit<ReadingHistoryItem, 'readAt'>): void {
  if (!isBrowser() || !item.id) return
  const current = getReadingHistory()
  const filtered = current.filter((x) => x.id !== item.id)
  const updated: ReadingHistoryItem[] = [{ ...item, readAt: Date.now() }, ...filtered].slice(
    0,
    MAX_HISTORY_ITEMS
  )
  safeSetStorage(READING_HISTORY_KEY, updated)
  notifySubscribers()
}

export function removeReadingHistory(id: string): void {
  if (!isBrowser() || !id) return
  const current = getReadingHistory()
  const updated = current.filter((x) => x.id !== id)
  safeSetStorage(READING_HISTORY_KEY, updated)
  notifySubscribers()
}

export function clearReadingHistory(): void {
  if (!isBrowser()) return
  safeSetStorage(READING_HISTORY_KEY, [])
  notifySubscribers()
}

export function subscribeReadingList(callback: () => void): () => void {
  if (!isBrowser()) return () => {}

  const handler = () => {
    cachedSavedArticles = null
    cachedReadingHistory = null
    callback()
  }

  window.addEventListener(READING_LIST_CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(READING_LIST_CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

const emptySaved: SavedArticleItem[] = []
const emptyHistory: ReadingHistoryItem[] = []

export function useReadingList() {
  const savedArticles = useSyncExternalStore(
    subscribeReadingList,
    getSavedArticles,
    () => emptySaved
  )

  const readingHistory = useSyncExternalStore(
    subscribeReadingList,
    getReadingHistory,
    () => emptyHistory
  )

  return {
    savedArticles,
    readingHistory,
    savedCount: savedArticles.length,
    isSaved: (id: string) => savedArticles.some((item) => item.id === id),
    isRead: (id: string) => readingHistory.some((item) => item.id === id),
    toggleSave: toggleSavedArticle,
    saveArticle,
    removeSavedArticle,
    clearSavedArticles,
    recordReadingHistory,
    removeReadingHistory,
    clearReadingHistory
  }
}
