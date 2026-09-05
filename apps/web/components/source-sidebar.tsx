import Link from 'next/link'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource, SignalSourceId } from '../lib/technology-sources'
import { cn } from '../lib/utils'

export function SourceSidebar({
  active,
  ariaLabel,
  basePath,
  sources
}: {
  active?: SignalSourceId
  ariaLabel: string
  basePath: OutboundReturnPath
  sources: readonly SignalSource[]
}) {
  return (
    <nav aria-label={ariaLabel} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <p className="mb-3 text-xs font-medium text-muted-foreground">平台</p>
      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-7 sm:px-7 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
        <ul className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:gap-1">
          <li>
            <Link
              aria-current={active ? undefined : 'page'}
              className={cn(
                'flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground lg:border-b-0 lg:border-l-2',
                !active && 'border-primary bg-accent font-medium text-accent-foreground'
              )}
              href={basePath}
            >
              全部平台
            </Link>
          </li>
          {sources.map((source) => (
            <li key={source.id}>
              <Link
                aria-current={active === source.id ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground lg:border-b-0 lg:border-l-2',
                  active === source.id &&
                    'border-primary bg-accent font-medium text-accent-foreground'
                )}
                href={`${basePath}/${source.id}`}
              >
                {source.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
