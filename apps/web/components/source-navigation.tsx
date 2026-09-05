import Link from 'next/link'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource, SignalSourceId } from '../lib/technology-sources'
import { cn } from '../lib/utils'

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
    'flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground'

  return (
    <nav aria-label={ariaLabel} className="min-w-0 border-b border-border">
      <p className="mb-1 text-xs font-medium text-muted-foreground">内容来源</p>
      <div className="-mx-5 overflow-x-auto px-5 sm:-mx-7 sm:px-7">
        <ul className="flex min-w-max gap-5 sm:min-w-0 sm:flex-wrap sm:gap-x-7">
          <li>
            <Link
              aria-current={active ? undefined : 'page'}
              className={cn(linkClassName, !active && 'border-primary font-medium text-primary')}
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
                  active === source.id && 'border-primary font-medium text-primary'
                )}
                href={`${basePath}/${source.id}`}
              >
                {source.shortName}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
