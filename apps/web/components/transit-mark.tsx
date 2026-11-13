import { cn } from '../lib/utils'

export function TransitMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('size-6 shrink-0', className)}
      viewBox="0 0 28 28"
      fill="none"
    >
      <rect
        x="1.5"
        y="1.5"
        width="25"
        height="25"
        rx="4"
        className="fill-card stroke-border"
        strokeWidth="1.25"
      />
      <path d="M5 19L12 12L17 15L23 8" stroke="var(--line-tech)" strokeWidth="2.2" />
      <path d="M6 10L12 12L16 20L22 18" stroke="var(--line-ai)" strokeWidth="2.2" />
      <circle
        cx="12"
        cy="12"
        r="3"
        className="fill-background"
        stroke="var(--foreground)"
        strokeWidth="1.75"
      />
      <circle cx="23" cy="8" r="2.2" fill="var(--line-tech)" />
      <circle cx="6" cy="10" r="2.2" fill="var(--line-ai)" />
    </svg>
  )
}
