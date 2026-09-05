import type { ComponentProps } from 'react'
import { cn } from '../lib/utils'

export function SignalSkeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-sm bg-skeleton', className)}
      {...props}
    />
  )
}
