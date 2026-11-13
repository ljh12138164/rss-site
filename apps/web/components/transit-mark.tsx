import { cn } from '../lib/utils'

export function TransitMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('size-6 shrink-0', className)}
      viewBox="0 0 32 32"
      fill="none"
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="6.5"
        className="fill-[#0b1224] stroke-[#243866] dark:fill-[#111b33] dark:stroke-[#2b4275]"
        strokeWidth="1.5"
      />
      <path
        d="M9.5 22.5L16 16H25"
        stroke="#3b82f6"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 16H16L22.5 9.5"
        stroke="#10b981"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="16"
        cy="16"
        r="4.2"
        className="fill-[#0b1224] dark:fill-[#111b33]"
        stroke="#f8fafc"
        strokeWidth="2.4"
      />
    </svg>
  )
}
