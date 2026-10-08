'use client'

import { listSignalSections } from '@rss-site/signals'
import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { useState } from 'react'
import type { AppType } from '../lib/hono-app'
import { ingestionOverview } from '../lib/ingestion-overview'
import { ActionButton } from './action-button'

const api = hc<AppType>('/')
const formatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Shanghai'
})

export function IngestionDashboard({ token }: { token: string }) {
  const [section, setSection] = useState('')
  const { data, isFetching, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin-ingestion', token],
    queryFn: async ({ signal }) => {
      const response = await api.api.admin.ingestion.$get(
        {},
        { headers: { Authorization: `Bearer ${token}` }, init: { signal, cache: 'no-store' } }
      )
      if (response.status !== 200)
        throw new Error(
          response.status === 401 ? '此账号没有采集看板权限。' : '采集统计读取失败，请重试。'
        )
      return (await response.json()).items
    },
    staleTime: 60000,
    gcTime: 0,
    retry: false
  })
  const { rows, summary } = ingestionOverview(isError ? undefined : data, section)
  const date = (value: string | null) => (value ? formatter.format(new Date(value)) : '—')
  return (
    <section
      aria-label="采集看板"
      className="min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-6"
      aria-busy={isFetching}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-balance text-lg font-semibold">采集概览</h2>
          <p className="mt-1 text-sm text-muted-foreground">各来源的运行状态与内容质量</p>
        </div>
        <ActionButton variant="outline" isDisabled={isFetching} onPress={() => void refetch()}>
          {isFetching ? '正在读取…' : '刷新统计'}
        </ActionButton>
      </div>
      <label className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        分区
        <select
          value={section}
          onChange={(event) => setSection(event.target.value)}
          className="min-h-11 rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <option value="">全部分区</option>
          {listSignalSections().map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
      </label>
      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: '正常来源',
            value: summary ? `${summary.healthy} / ${summary.total}` : '—',
            detail: summary ? '当前分区已注册来源' : '统计暂不可用'
          },
          {
            label: '需要关注',
            value: summary ? String(summary.attention) : '—',
            detail: summary
              ? `失败或延迟 · 采集中 ${summary.running} · 未采集 ${summary.uncollected}`
              : '统计暂不可用'
          },
          {
            label: '最近成功',
            value: summary ? date(summary.latestSuccess) : '—',
            detail: summary ? '当前分区最近一次成功采集' : '统计暂不可用'
          },
          {
            label: '正文覆盖率',
            value: summary?.bodyCoverage != null ? `${summary.bodyCoverage}%` : '—',
            detail: summary
              ? summary.sampleCount
                ? `${summary.bodyCount} / ${summary.sampleCount} 篇抽样文章有正文`
                : '暂无文章样本'
              : '统计暂不可用'
          }
        ].map(({ label, value, detail }) => (
          <div key={label} className="min-w-0 rounded-lg border border-border p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-2 text-xl font-semibold tracking-tight tabular-nums">{value}</dd>
            <dd className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-pretty text-xs leading-5 text-muted-foreground">
        统计随分区筛选更新。连续失败按保留的运行记录统计；正文覆盖率按文章样本数加权，每个来源抽查最近
        100 篇保存文章。开源和 Skills 排行不统计正文覆盖率。
      </p>
      {isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error.message}
        </p>
      )}
      {!data && isFetching ? (
        <p role="status" className="py-6 text-sm text-muted-foreground">
          正在读取各平台采集状态、运行数量与正文统计…
        </p>
      ) : (
        summary && (
          <>
            <p role="status" className="mt-4 text-xs text-muted-foreground">
              统计读取于 {formatter.format(dataUpdatedAt)}
            </p>
            <section
              aria-label="来源状态表，支持滚动"
              // biome-ignore lint/a11y/noNoninteractiveTabindex: Allow keyboard scrolling of the source table.
              tabIndex={0}
              className="mt-4 max-h-96 max-w-full overflow-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-primary"
            >
              <table className="w-full text-left text-sm tabular-nums">
                <caption className="sr-only">各来源采集健康状态</caption>
                <thead className="sticky top-0 border-b border-border bg-muted text-xs text-muted-foreground">
                  <tr>
                    {[
                      '平台',
                      '状态',
                      '最近成功',
                      '成功条数',
                      '最近运行',
                      '连续失败',
                      '正文覆盖率'
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="whitespace-nowrap px-3 py-3 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map(({ source, row, state }) => (
                    <tr key={source.id}>
                      <th
                        scope="row"
                        className="max-w-48 truncate px-3 py-3 font-medium"
                        title={source.name}
                      >
                        {source.name}
                      </th>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className={
                            state === '连续失败' || state === '更新延迟'
                              ? 'inline-flex rounded-md border border-destructive/25 px-2 py-1 text-xs text-destructive'
                              : state === '正常'
                                ? 'inline-flex rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground'
                                : 'inline-flex rounded-md border border-border px-2 py-1 text-xs text-muted-foreground'
                          }
                        >
                          {state}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{date(row.last_success_at)}</td>
                      <td className="px-3 py-3">
                        {row.last_success_at ? row.last_item_count : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{date(row.last_run_at)}</td>
                      <td className="px-3 py-3">{row.consecutive_failures}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {!source.isArticle || !row.sample_count
                          ? '—'
                          : `${Math.round((row.body_count / row.sample_count) * 100)}% (${row.body_count}/${row.sample_count})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )
      )}
    </section>
  )
}
