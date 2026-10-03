'use client'

import { listSignalSections, listSignalSources } from '@rss-site/signals'
import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { useState } from 'react'
import type { AppType } from '../lib/hono-app'
import { type IngestionHealth, ingestionHealthState } from '../lib/ingestion-health'
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
  const rows = listSignalSources()
    .filter((source) => !section || source.section === section)
    .map((source) => {
      const row: IngestionHealth = data?.find((entry) => entry.source === source.id) ?? {
        source: source.id,
        last_success_at: null,
        last_item_count: 0,
        last_run_at: null,
        last_run_status: null,
        consecutive_failures: 0,
        sample_count: 0,
        body_count: 0
      }
      return { source, row, state: ingestionHealthState(row) }
    })
  const date = (value: string | null) => (value ? formatter.format(new Date(value)) : '—')
  return (
    <section
      aria-label="采集看板"
      className="mb-8 min-w-0 border-y border-border py-6"
      aria-busy={isFetching}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-balance text-lg font-semibold">采集看板</h2>
        <ActionButton variant="outline" isDisabled={isFetching} onPress={() => void refetch()}>
          {isFetching ? '正在读取…' : '刷新统计'}
        </ActionButton>
      </div>
      <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
        连续失败按保留的运行记录统计；正文覆盖率抽查每个来源最近 100 篇保存文章。开源和 Skills
        排行不统计正文覆盖率。
      </p>
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
        data && (
          <>
            <p role="status" className="mt-4 text-xs text-muted-foreground">
              统计读取于 {formatter.format(dataUpdatedAt)}
            </p>
            <div className="mt-4 max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm tabular-nums">
                <caption className="sr-only">各来源采集健康状态</caption>
                <thead className="border-b border-border text-xs text-muted-foreground">
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
                        className="max-w-48 truncate px-3 py-4 font-medium"
                        title={source.name}
                      >
                        {source.name}
                      </th>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span
                          className={
                            state === '连续失败' || state === '更新延迟'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          }
                        >
                          {state}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">{date(row.last_success_at)}</td>
                      <td className="px-3 py-4">
                        {row.last_success_at ? row.last_item_count : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">{date(row.last_run_at)}</td>
                      <td className="px-3 py-4">{row.consecutive_failures}</td>
                      <td className="whitespace-nowrap px-3 py-4">
                        {!source.isArticle || !row.sample_count
                          ? '—'
                          : `${Math.round((row.body_count / row.sample_count) * 100)}% (${row.body_count}/${row.sample_count})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </section>
  )
}
