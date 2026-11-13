'use client'

import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Checkbox, CheckboxGroup } from 'react-aria-components'
import { cn } from '../../lib/utils'

export function UiCheckboxGroup({
  ariaLabel,
  value,
  onChange,
  isDisabled = false,
  className,
  children
}: {
  ariaLabel: string
  value: string[]
  onChange: (value: string[]) => void
  isDisabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <CheckboxGroup
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      className={cn('min-w-0', className)}
    >
      {children}
    </CheckboxGroup>
  )
}

export function UiCheckbox({
  value,
  isSelected,
  onChange,
  isDisabled,
  className,
  children
}: {
  value?: string
  isSelected?: boolean
  onChange?: (isSelected: boolean) => void
  isDisabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Checkbox
      value={value}
      isSelected={isSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={cn(
        'group flex min-h-9 min-w-0 cursor-pointer items-center gap-2.5 text-sm text-foreground outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:text-muted-foreground',
        className
      )}
    >
      {({ isSelected: selected, isIndeterminate }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors group-data-[focus-visible]:outline-2 group-data-[focus-visible]:outline-offset-2 group-data-[focus-visible]:outline-ring',
              selected || isIndeterminate
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-strong bg-card group-data-[hovered]:border-primary/70'
            )}
          >
            {(selected || isIndeterminate) && (
              <Check aria-hidden="true" className="size-3 stroke-[2.5]" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
        </>
      )}
    </Checkbox>
  )
}
