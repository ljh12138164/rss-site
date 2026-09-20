import { ArrowUpRight, GitFork, Star } from 'lucide-react'
import Link from 'next/link'
import { parseGitHubRepository } from '../lib/github-repository'
import type { HotItem } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'

const countFormatter = new Intl.NumberFormat('en-US')

export function GitHubRepositoryRow({
  item,
  returnTo
}: {
  item: HotItem
  returnTo: OutboundReturnPath
}) {
  const repository = parseGitHubRepository(item)
  const href = `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(returnTo)}`

  return (
    <li className="-mx-2 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border px-2 py-5 transition-colors last:border-b-0 hover:bg-row-highlight sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5 sm:py-6">
      <span aria-hidden="true" className="rank-numeral pt-1" data-rank={item.position}>
        {String(item.position).padStart(2, '0')}
      </span>
      <article className="min-w-0">
        {repository.owner ? (
          <div className="mb-2 flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
            {repository.avatarUrl ? (
              <span
                aria-hidden="true"
                className="size-5 shrink-0 rounded-full border border-border bg-muted bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(repository.avatarUrl)})` }}
              />
            ) : null}
            <span className="truncate" title={repository.owner}>
              {repository.owner}
            </span>
          </div>
        ) : null}
        <Link className="group block max-w-full text-foreground" href={href}>
          <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-7 tracking-[-0.01em] transition-colors group-hover:text-primary sm:text-[1.0625rem]">
            <span className="min-w-0 wrap-anywhere">{repository.name}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            />
          </span>
          {repository.description ? (
            <span className="mt-2 line-clamp-2 text-sm font-normal leading-6 text-muted-foreground">
              {repository.description}
            </span>
          ) : null}
          {repository.language || repository.stars !== null || repository.forks !== null ? (
            <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
              {repository.language ? (
                <span className="inline-flex items-center gap-1.5" title="编程语言">
                  <span aria-hidden="true" className="size-2 rounded-full bg-primary/70" />
                  <span className="sr-only">编程语言：</span>
                  {repository.language}
                </span>
              ) : null}
              {repository.stars !== null ? (
                <span className="inline-flex items-center gap-1 tabular-nums" title="Stars">
                  <Star aria-hidden="true" className="size-3.5 fill-current" />
                  <span className="sr-only">Stars：</span>
                  {countFormatter.format(repository.stars)}
                </span>
              ) : null}
              {repository.forks !== null ? (
                <span className="inline-flex items-center gap-1 tabular-nums" title="Forks">
                  <GitFork aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">Forks：</span>
                  {countFormatter.format(repository.forks)}
                </span>
              ) : null}
            </span>
          ) : null}
        </Link>
      </article>
    </li>
  )
}
