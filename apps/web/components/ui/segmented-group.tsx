'use client'

import type { ReactNode } from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components'
import { cn } from '../../lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  isDisabled?: boolean
}

export function UiSegmentedGroup<T extends string>({
  ariaLabel,
  value,
  onChange,
  options,
  className,
  buttonClassName
}: {
  ariaLabel: string
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  className?: string
  buttonClassName?: string
}) {
  return (
    <ToggleButtonGroup
      aria-label={ariaLabel}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const next = keys.values().next().value
        if (typeof next === 'string') onChange(next as T)
      }}
      className={cn(
        'inline-flex items-center rounded-sm border border-border bg-muted p-1 text-xs font-medium',
        className
      )}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          id={option.value}
          isDisabled={option.isDisabled}
          className={cn(
            'inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground data-[selected]:bg-card data-[selected]:font-semibold data-[selected]:text-foreground data-[selected]:shadow-xs data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-1 data-[focus-visible]:outline-ring data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
            buttonClassName
          )}
        >
          {option.icon}
          <span>{option.label}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
