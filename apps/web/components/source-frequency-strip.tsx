import Link from 'next/link'
import { type TechnologySourceId, technologySources } from '../lib/technology-sources'
import { cn } from '../lib/utils'

export function SourceFrequencyStrip({ active }: { active?: TechnologySourceId }) {
  return (
    <nav aria-label="科技来源频段" className="border-y border-border">
      <ol className="grid grid-cols-3 sm:grid-cols-6">
        {technologySources.map((source, index) => (
          <li
            className={cn(
              'border-border',
              index % 3 !== 2 && 'border-r',
              index < 3 && 'border-b sm:border-b-0',
              index !== technologySources.length - 1 && 'sm:border-r'
            )}
            key={source.id}
          >
            <Link
              aria-current={active === source.id ? 'page' : undefined}
              className={cn(
                'group flex min-h-16 flex-col justify-center px-3 transition-colors hover:bg-accent/60 focus-visible:outline-offset-[-3px] sm:min-h-20',
                active === source.id && 'bg-accent text-accent-foreground'
              )}
              href={`/technology/${source.id}`}
            >
              <span className="font-mono text-sm font-semibold tracking-[0.08em] text-primary">
                {source.code}
              </span>
              <span className="mt-1 truncate text-[0.6875rem] text-muted-foreground group-hover:text-foreground">
                {source.shortName}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
