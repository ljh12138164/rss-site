'use client'

import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { hc, type InferResponseType } from 'hono/client'
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Radio,
  RefreshCw,
  Save,
  Search,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'
import { ActionButton } from '../../components/action-button'
import { ArticleEditor } from '../../components/article-editor'
import { IngestionDashboard } from '../../components/ingestion-dashboard'
import { createAdminBrowserClient } from '../../lib/admin-supabase'
import type { AppType } from '../../lib/hono-app'
import { cn } from '../../lib/utils'

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
  const [loadError, setLoadError] = useState('')
  const [refreshingAccess, setRefreshingAccess] = useState(false)
  const isAdmin = session?.user.app_metadata.role === 'article_admin'

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
    if (!session || !isAdmin) return
    let active = true
    setLoading(true)
    setLoadError('')
    api.api.admin.articles
      .$get(
        { query: { page: String(page), q: search } },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      .then(async (response) => {
        if (!active) return
        if (!response.ok) {
          setItems([])
          setHasMore(false)
          setLoadError(
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
        if (active) setLoadError('文章加载失败，请检查网络后重试。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session, isAdmin, page, search, reload])

  async function refreshAccess() {
    if (!client) return
    setRefreshingAccess(true)
    setMessage('')
    try {
      const { data, error } = await client.auth.refreshSession()
      if (error) throw error
      setSession(data.session)
      if (data.session?.user.app_metadata.role !== 'article_admin')
        setMessage('此账号尚未获得管理员权限。授权后可再次刷新，或退出后重新登录。')
    } catch {
      setMessage('登录凭据刷新失败，请退出后重新登录。')
    } finally {
      setRefreshingAccess(false)
    }
  }

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
    'mt-2 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
  const button =
    'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50'

  return (
    <div className="min-h-dvh bg-muted/30 text-foreground lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="border-b border-border bg-background lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5 lg:px-6 lg:py-7">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Radio size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">热点更新</p>
            <p className="text-xs text-muted-foreground">管理工作台</p>
          </div>
        </div>
        <nav
          aria-label="管理导航"
          className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-3"
        >
          <Link
            href="/admin"
            aria-current="page"
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <LayoutDashboard size={18} aria-hidden="true" /> 管理总览
          </Link>
          {isAdmin && (
            <>
              <a
                href="#collection"
                className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Radio size={18} aria-hidden="true" /> 采集看板
              </a>
              <a
                href="#articles"
                className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <FileText size={18} aria-hidden="true" /> 文章管理
              </a>
            </>
          )}
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={18} aria-hidden="true" /> 返回站点
          </Link>
        </nav>
        <p className="hidden px-6 pt-8 text-pretty text-xs leading-6 text-muted-foreground lg:block">
          检查各平台的采集状态，
          <br />
          修正文章标题与内容。
        </p>
      </aside>
      <main className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-5 py-5 sm:px-8">
          <div className="min-w-0">
            <p className="mb-1 text-xs text-muted-foreground">热点更新 / 管理后台</p>
            <h1 className="text-balance text-2xl font-semibold">内容管理</h1>
          </div>
          {session && (
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-64 truncate text-sm" title={session.user.email}>
                  {session.user.email}
                </p>
                <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <ShieldCheck size={13} aria-hidden="true" />
                  {isAdmin ? '管理员' : '待授权'}
                </p>
              </div>
              <ActionButton variant="outline" onPress={() => void client?.auth.signOut()}>
                <LogOut size={15} aria-hidden="true" />
                退出登录
              </ActionButton>
            </div>
          )}
        </header>
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
          {session === undefined ? (
            <p role="status" className="text-sm text-muted-foreground">
              正在检查登录状态…
            </p>
          ) : null}
          {session === null ? (
            <form
              onSubmit={signIn}
              className="mx-auto max-w-md space-y-5 rounded-xl border border-border bg-card p-6 sm:mt-12 sm:p-8"
            >
              <div>
                <h2 className="text-balance text-xl font-semibold">管理员登录</h2>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">
                  登录后查看采集状态，管理文章内容。
                </p>
              </div>
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
          {session && !isAdmin && (
            <section className="rounded-xl border border-border bg-card p-6">
              <ShieldCheck size={28} className="mb-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-balance text-lg font-semibold">此账号尚未获得管理权限</h2>
              <p className="mt-2 mb-5 max-w-xl text-pretty text-sm leading-6 text-muted-foreground">
                管理员授权后，点击刷新权限。若仍无法访问，请退出后重新登录。
              </p>
              <ActionButton
                variant="outline"
                isDisabled={refreshingAccess}
                onPress={() => void refreshAccess()}
              >
                <RefreshCw size={16} aria-hidden="true" />
                {refreshingAccess ? '正在刷新…' : '刷新权限'}
              </ActionButton>
            </section>
          )}
          {session && isAdmin && (
            <div id="collection" className="scroll-mt-6">
              <IngestionDashboard key={session.user.id} token={session.access_token} />
            </div>
          )}
          {session && isAdmin && (
            <section
              id="articles"
              aria-label="文章管理"
              className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
                <h2 className="text-balance flex items-center gap-2 text-base font-semibold">
                  <FileText size={18} className="text-primary" aria-hidden="true" />
                  文章管理
                </h2>
                <p className="text-pretty text-xs text-muted-foreground">
                  选择文章，修正标题、摘要和正文
                </p>
              </div>
              <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <section
                  aria-label="文章列表"
                  className="min-w-0 border-b border-border p-5 lg:border-r lg:border-b-0"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-balance text-sm font-semibold">最新文章</h3>
                    <ActionButton
                      variant="ghost"
                      isDisabled={loading}
                      onPress={() => setReload((value) => value + 1)}
                    >
                      <RefreshCw size={14} aria-hidden="true" />
                      刷新
                    </ActionButton>
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
                    <button type="submit" className={cn(button, 'mt-2')}>
                      <Search size={14} aria-hidden="true" />
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
                  ) : loadError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <p role="alert" className="mb-3 text-sm text-destructive">
                        {loadError}
                      </p>
                      <ActionButton
                        variant="outline"
                        onPress={() => setReload((value) => value + 1)}
                      >
                        重新加载
                      </ActionButton>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center">
                      <FileText
                        size={28}
                        className="mx-auto mb-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium">
                        {search ? '没有找到匹配的文章' : '暂无采集文章'}
                      </p>
                      <p className="mt-2 mb-4 text-pretty text-xs text-muted-foreground">
                        {search
                          ? '换个关键词，或清除搜索查看最新文章。'
                          : '可以先在采集看板查看各来源状态。'}
                      </p>
                      {search ? (
                        <ActionButton
                          variant="outline"
                          onPress={() => {
                            setSearch('')
                            setSearchInput('')
                            setPage(0)
                          }}
                        >
                          清除搜索
                        </ActionButton>
                      ) : (
                        <a href="#collection" className="text-sm text-primary hover:underline">
                          查看采集状态
                        </a>
                      )}
                    </div>
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
                            aria-pressed={selected?.id === item.id}
                            className={cn(
                              'w-full min-w-0 border-l-2 border-transparent px-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-primary',
                              selected?.id === item.id
                                ? 'border-primary bg-accent/50'
                                : 'hover:bg-muted'
                            )}
                          >
                            <span className="block truncate text-sm font-medium" title={item.title}>
                              {item.title}
                            </span>
                            <span className="mt-2 block truncate text-xs text-muted-foreground">
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

                <section aria-label="编辑文章" className="min-w-0 p-5 sm:p-6 lg:self-start">
                  {!draft ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-12 text-center">
                      <span className="mb-4 flex size-14 items-center justify-center rounded-xl bg-muted">
                        <FileText size={24} className="text-muted-foreground" aria-hidden="true" />
                      </span>
                      <h3 className="text-balance font-medium">选择一篇文章开始编辑</h3>
                      <p className="mt-2 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
                        在文章列表中选择内容，即可修改标题、摘要和正文。保存后，后续采集会保留人工修改。
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={save} className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3
                          className="min-w-0 truncate text-base font-semibold"
                          title={draft.title}
                        >
                          编辑文章
                        </h3>
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
                      <ArticleEditor
                        key={draft.id}
                        value={draft.content_html ?? ''}
                        disabled={saving}
                        onChange={(html) =>
                          setDraft((current) =>
                            current ? { ...current, content_html: html } : current
                          )
                        }
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block min-w-0 text-sm font-medium">
                          封面 URL
                          <input
                            className={field}
                            type="url"
                            value={draft.image_url ?? ''}
                            onChange={(event) =>
                              setDraft({ ...draft, image_url: event.target.value })
                            }
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
                            onChange={(event) =>
                              setDraft({ ...draft, is_pinned: event.target.checked })
                            }
                          />{' '}
                          置顶
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                        <p className="max-w-xs text-pretty text-xs leading-5 text-muted-foreground">
                          保存后，后续采集会保留这篇文章的人工修改。
                        </p>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                        >
                          <Save size={16} />
                          {saving ? '保存中…' : '保存修改'}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
