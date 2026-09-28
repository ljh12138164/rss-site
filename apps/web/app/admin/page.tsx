'use client'

import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { hc, type InferResponseType } from 'hono/client'
import { ArrowLeft, ArrowUpRight, Save } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'
import { createAdminBrowserClient } from '../../lib/admin-supabase'
import type { AppType } from '../../lib/hono-app'

const api = hc<AppType>('/')
type AdminArticle = InferResponseType<typeof api.api.admin.articles.$get, 200>['items'][number]

function localDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function AdminPage() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null | undefined>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [items, setItems] = useState<AdminArticle[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState<AdminArticle | null>(null)
  const [draft, setDraft] = useState<AdminArticle | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      const auth = createAdminBrowserClient()
      setClient(auth)
      auth.auth.getSession().then(({ data }) => setSession(data.session))
      const { data } = auth.auth.onAuthStateChange((_event, next) => setSession(next))
      return () => data.subscription.unsubscribe()
    } catch {
      setMessage('Supabase 尚未配置，无法打开管理后台。')
      setSession(null)
    }
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload explicitly refreshes this page.
  useEffect(() => {
    if (!session) return
    let active = true
    setLoading(true)
    setMessage('')
    api.api.admin.articles
      .$get(
        { query: { page: String(page), q: search } },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      .then(async (response) => {
        if (!active) return
        if (!response.ok) {
          setItems([])
          setMessage(
            response.status === 401 ? '此账号没有文章管理权限。' : '文章加载失败，请重试。'
          )
          return
        }
        const result = await response.json()
        if (!active) return
        setItems(result.items)
        setHasMore(result.hasMore)
      })
      .catch(() => {
        if (active) setMessage('文章加载失败，请检查网络后重试。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session, page, search, reload])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setMessage('')
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) setMessage('登录失败，请检查邮箱和密码。')
    setPassword('')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !draft) return
    setSaving(true)
    setMessage('')
    try {
      const response = await api.api.admin.articles[':id'].$patch(
        {
          param: { id: draft.id },
          json: {
            title: draft.title,
            summary: draft.summary || null,
            contentHtml: draft.content_html || null,
            imageUrl: draft.image_url || null,
            author: draft.author || null,
            publishedAt: draft.published_at ? new Date(draft.published_at).toISOString() : null,
            isPinned: draft.is_pinned
          }
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      if (!response.ok) {
        setMessage('保存失败，请检查填写内容和管理员权限。')
        return
      }
      const { article } = await response.json()
      setItems((current) => current.map((item) => (item.id === article.id ? article : item)))
      setSelected(article)
      setDraft(article)
      setMessage('已保存。后续采集会保留这篇文章的人工修改。')
    } catch {
      setMessage('保存失败，请检查网络后重试。')
    } finally {
      setSaving(false)
    }
  }

  const field =
    'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
  const button =
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50'

  return (
    <main className="mx-auto min-h-dvh w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={16} /> 返回站点
          </Link>
          <h1 className="headline-display mt-4 text-3xl text-foreground sm:text-4xl">文章管理</h1>
          <p className="mt-2 text-sm text-muted-foreground">查看采集文章，修正展示内容。</p>
        </div>
        {session && (
          <button type="button" className={button} onClick={() => client?.auth.signOut()}>
            退出登录
          </button>
        )}
      </header>

      {session === undefined ? (
        <p role="status" className="text-sm text-muted-foreground">
          正在检查登录状态…
        </p>
      ) : null}
      {session === null ? (
        <form onSubmit={signIn} className="max-w-sm space-y-5 border-t-2 border-primary pt-6">
          <h2 className="text-lg font-semibold">管理员登录</h2>
          <label className="block text-sm font-medium">
            邮箱
            <input
              className={field}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            密码
            <input
              className={field}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            className="min-h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="submit"
            disabled={!client}
          >
            登录
          </button>
        </form>
      ) : null}
      {message && (
        <p
          role="status"
          className="mb-5 rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground"
        >
          {message}
        </p>
      )}
      {session && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section aria-label="文章列表" className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">最新文章</h2>
              <button
                type="button"
                className={button}
                onClick={() => setReload((value) => value + 1)}
              >
                刷新
              </button>
            </div>
            <form
              className="mb-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                setPage(0)
                setSearch(searchInput.trim())
                setSelected(null)
                setDraft(null)
              }}
            >
              <label className="sr-only" htmlFor="admin-search">
                搜索文章标题
              </label>
              <input
                id="admin-search"
                className={field}
                placeholder="搜索文章标题"
                maxLength={80}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className={button}>
                搜索
              </button>
            </form>
            {loading ? (
              <p
                role="status"
                className="border-y border-border py-8 text-sm text-muted-foreground"
              >
                正在读取文章…
              </p>
            ) : items.length === 0 ? (
              <p className="border-y border-border py-8 text-sm text-muted-foreground">
                暂无文章。
              </p>
            ) : (
              <ul className="max-h-[50dvh] divide-y divide-border overflow-y-auto border-y border-border lg:max-h-[65dvh]">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(item)
                        setDraft(item)
                        setMessage('')
                      }}
                      className={`w-full min-w-0 px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-primary ${selected?.id === item.id ? 'bg-accent' : 'hover:bg-muted'}`}
                    >
                      <span className="block truncate text-sm font-medium" title={item.title}>
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {item.section} / {item.source}
                        {item.editorial_locked ? ' · 已人工编辑' : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center gap-3 text-sm">
              <button
                type="button"
                className={button}
                disabled={page === 0 || loading}
                onClick={() => {
                  setSelected(null)
                  setDraft(null)
                  setPage((value) => value - 1)
                }}
              >
                上一页
              </button>
              <span className="tabular-nums text-muted-foreground">第 {page + 1} 页</span>
              <button
                type="button"
                className={button}
                disabled={!hasMore || loading}
                onClick={() => {
                  setSelected(null)
                  setDraft(null)
                  setPage((value) => value + 1)
                }}
              >
                下一页
              </button>
            </div>
          </section>

          <section
            aria-label="编辑文章"
            className="min-w-0 border-t-2 border-primary pt-4 lg:sticky lg:top-6 lg:self-start"
          >
            {!draft ? (
              <p className="py-8 text-sm text-muted-foreground">从左侧选择一篇文章开始编辑。</p>
            ) : (
              <form onSubmit={save} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 truncate text-lg font-semibold" title={draft.title}>
                    编辑文章
                  </h2>
                  <a
                    href={draft.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                  >
                    原文 <ArrowUpRight size={14} />
                  </a>
                </div>
                <label className="block text-sm font-medium">
                  标题
                  <input
                    className={field}
                    required
                    maxLength={500}
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  摘要
                  <textarea
                    className={`${field} min-h-24`}
                    value={draft.summary ?? ''}
                    onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  正文 HTML
                  <textarea
                    className={`${field} min-h-48 font-mono text-xs`}
                    value={draft.content_html ?? ''}
                    onChange={(event) => setDraft({ ...draft, content_html: event.target.value })}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0 text-sm font-medium">
                    封面 URL
                    <input
                      className={field}
                      type="url"
                      value={draft.image_url ?? ''}
                      onChange={(event) => setDraft({ ...draft, image_url: event.target.value })}
                    />
                  </label>
                  <label className="block min-w-0 text-sm font-medium">
                    作者
                    <input
                      className={field}
                      value={draft.author ?? ''}
                      onChange={(event) => setDraft({ ...draft, author: event.target.value })}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-end gap-5">
                  <label className="block text-sm font-medium">
                    发布时间
                    <input
                      className={field}
                      type="datetime-local"
                      value={localDate(draft.published_at)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          published_at: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : null
                        })
                      }
                    />
                  </label>
                  <label className="inline-flex min-h-10 items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={draft.is_pinned}
                      onChange={(event) => setDraft({ ...draft, is_pinned: event.target.checked })}
                    />{' '}
                    置顶
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? '保存中…' : '保存修改'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
