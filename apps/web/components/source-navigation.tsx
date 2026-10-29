import Link from 'next/link'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource, SignalSourceId } from '../lib/technology-sources'
import { cn } from '../lib/utils'
import { SourceIcon } from './source-icon'

export function SourceNavigation({
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
  const linkClassName =
    'flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary'

  return (
    <nav aria-label={ariaLabel} className="min-w-0 border-b border-border/80 pb-3">
      <div className="relative -mx-5 overflow-x-auto px-5 pb-1 slim-scrollbar sm:-mx-7 sm:px-7">
        <ul className="flex min-w-max items-center gap-2 py-0.5 sm:min-w-0 sm:flex-wrap sm:gap-2">
          <li>
            <Link
              aria-current={active ? undefined : 'page'}
              className={cn(
                linkClassName,
                !active
                  ? 'border-primary bg-primary/10 font-semibold text-primary shadow-2xs'
                  : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/80 hover:text-foreground'
              )}
              href={basePath}
            >
              全部
            </Link>
          </li>
          {sources.map((source) => (
            <li key={source.id}>
              <Link
                aria-current={active === source.id ? 'page' : undefined}
                className={cn(
                  linkClassName,
                  active === source.id
                    ? 'border-primary bg-primary/10 font-semibold text-primary shadow-2xs'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/80 hover:text-foreground'
                )}
                href={`${basePath}/${source.id}`}
              >
                <SourceIcon className="size-3.5 shrink-0" source={source} />
                {source.shortName}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
