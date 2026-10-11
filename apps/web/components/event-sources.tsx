import Link from 'next/link'
import { findSignalSource } from '../lib/technology-sources'
import { SourceIcon } from './source-icon'

export function EventSources({ sources }: { sources: string[] }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>来源：</span>
      {sources.length ? (
        [...new Set(sources)].map((id) => {
          const source = findSignalSource(id)
          return source ? (
            <Link
              key={id}
              href={`/${source.section}/${source.id}`}
              className="inline-flex min-h-11 min-w-0 items-center gap-1.5 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              title={source.name}
            >
              <SourceIcon source={source} className="size-4 shrink-0" />
              <span className="truncate">{source.name}</span>
            </Link>
          ) : (
            <span key={id} className="min-w-0 truncate" title={id}>
              {id}
            </span>
          )
        })
      ) : (
        <span>来源暂缺</span>
      )}
    </div>
  )
}
