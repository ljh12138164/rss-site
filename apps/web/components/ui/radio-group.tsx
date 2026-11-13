'use client'

import type { ReactNode } from 'react'
import { Label, Radio, RadioGroup } from 'react-aria-components'
import { cn } from '../../lib/utils'

export function UiRadioGroup({
  label,
  ariaLabel,
  value,
  onChange,
  orientation = 'horizontal',
  isDisabled = false,
  className,
  children
}: {
  label?: string
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  isDisabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <RadioGroup
      aria-label={label ? undefined : ariaLabel}
      value={value}
      onChange={onChange}
      orientation={orientation}
      isDisabled={isDisabled}
      className={cn(
        orientation === 'horizontal'
          ? 'flex flex-wrap items-center gap-x-5 gap-y-2'
          : 'flex flex-col gap-2',
        className
      )}
    >
      {label && <Label className="sr-only">{label}</Label>}
      {children}
    </RadioGroup>
  )
}

export function UiRadio({
  value,
  isDisabled,
  className,
  children
}: {
  value: string
  isDisabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Radio
      value={value}
      isDisabled={isDisabled}
      className={cn(
        'group flex min-h-9 cursor-pointer items-center gap-2 rounded-sm text-sm text-foreground outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:text-muted-foreground',
        className
      )}
    >
      {({ isSelected }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors group-data-[focus-visible]:outline-2 group-data-[focus-visible]:outline-offset-2 group-data-[focus-visible]:outline-ring',
              isSelected
                ? 'border-primary bg-primary'
                : 'border-strong bg-card group-data-[hovered]:border-primary/70'
            )}
          >
            {isSelected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
          </span>
          <span>{children}</span>
        </>
      )}
    </Radio>
  )
}
