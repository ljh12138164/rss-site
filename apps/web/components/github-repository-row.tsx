import { ArrowUpRight, GitFork, Star } from 'lucide-react'
import { parseGitHubRepository } from '../lib/github-repository'
import type { HotItem } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'

const countFormatter = new Intl.NumberFormat('en-US')

export function GitHubRepositoryRow({
  item,
  returnTo: _returnTo
}: {
  item: HotItem
  returnTo?: OutboundReturnPath
}) {
  const repository = parseGitHubRepository(item)
  const href = item.url

  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 px-4 py-4 transition-colors hover:bg-row-highlight sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-5">
      <span aria-hidden="true" className="rank-numeral pt-0.5" data-rank={item.position}>
        {String(item.position).padStart(2, '0')}
      </span>
      <article className="min-w-0">
        {repository.owner ? (
          <div className="mb-1.5 flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
            {repository.avatarUrl ? (
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full border border-border bg-muted bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(repository.avatarUrl)})` }}
              />
            ) : null}
            <span className="truncate" title={repository.owner}>
              {repository.owner}
            </span>
          </div>
        ) : null}
        <a
          className="group block max-w-full text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          href={href}
          target="_blank"
          rel="noreferrer noopener external"
          data-outbound
        >
          <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-6 transition-colors group-hover:text-primary">
            <span className="min-w-0 wrap-anywhere">{repository.name}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
            />
          </span>
          {repository.description ? (
            <span className="mt-1.5 line-clamp-2 block text-sm font-normal leading-6 text-muted-foreground">
              {repository.description}
            </span>
          ) : null}
          {repository.language || repository.stars !== null || repository.forks !== null ? (
            <span className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
              {repository.language ? (
                <span className="inline-flex items-center gap-1.5" title="编程语言">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: 'var(--line-tech)' }}
                  />
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
        </a>
      </article>
    </li>
  )
}
