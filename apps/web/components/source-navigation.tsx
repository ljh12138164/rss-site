import Link from 'next/link'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource, SignalSourceId } from '../lib/technology-sources'
import { cn } from '../lib/utils'
import { SourceIcon } from './source-icon'

export function SourceNavigation({
  active,
  ariaLabel,
  basePath,
  lineColor,
  sources
}: {
  active?: SignalSourceId
  ariaLabel: string
  basePath: OutboundReturnPath
  lineColor?: string
  sources: readonly SignalSource[]
}) {
  const itemClass = (selected: boolean) =>
    cn(
      'relative flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
      selected
        ? 'border-strong bg-accent font-semibold text-foreground'
        : 'border-border bg-card text-muted-foreground hover:border-strong hover:text-foreground'
    )

  const activeBar = (
    <span
      aria-hidden="true"
      className="absolute inset-x-1.5 bottom-0 h-[2px]"
      style={{ backgroundColor: lineColor ?? 'var(--primary)' }}
    />
  )

  return (
    <nav aria-label={ariaLabel} className="min-w-0 border-b border-border pb-3">
      <div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 pb-1 slim-scrollbar sm:mx-0 sm:px-0">
        <ul className="flex min-w-max items-center gap-1.5 sm:min-w-0 sm:flex-wrap sm:gap-2">
          <li>
            <Link
              aria-current={active ? undefined : 'page'}
              className={itemClass(!active)}
              href={basePath}
            >
              {!active && activeBar}
              全部
            </Link>
          </li>
          {sources.map((source) => {
            const isSelected = active === source.id
            return (
              <li key={source.id}>
                <Link
                  aria-current={isSelected ? 'page' : undefined}
                  className={itemClass(isSelected)}
                  href={`${basePath}/${source.id}`}
                >
                  {isSelected && activeBar}
                  <SourceIcon className="size-3.5 shrink-0" source={source} />
                  {source.shortName}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
