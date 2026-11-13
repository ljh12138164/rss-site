import { cn } from '../lib/utils'

export type ActionVariant = 'primary' | 'outline' | 'ghost'
export type ActionSize = 'default' | 'large' | 'icon'

const variants: Record<ActionVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold',
  outline: 'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
  ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground'
}

const sizes: Record<ActionSize, string> = {
  default: 'min-h-10 px-4',
  large: 'min-h-11 px-5',
  icon: 'size-10'
}

export function actionStyles(
  variant: ActionVariant = 'primary',
  size: ActionSize = 'default',
  className?: string
) {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[pressed]:translate-y-px',
    variants[variant],
    sizes[size],
    className
  )
}
