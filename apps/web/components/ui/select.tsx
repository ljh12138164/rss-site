'use client'

import { Check, ChevronDown } from 'lucide-react'
import {
  Button,
  type Key,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue
} from 'react-aria-components'
import { cn } from '../../lib/utils'

export interface UiSelectOption {
  value: string
  label: string
}

const EMPTY_KEY = '__empty__'

function encodeKey(value: string): string {
  return value === '' ? EMPTY_KEY : value
}

function decodeKey(key: Key | null): string {
  if (key == null || key === EMPTY_KEY) return ''
  return String(key)
}

export function UiSelect({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
  isDisabled = false,
  layout = 'vertical',
  className,
  triggerClassName
}: {
  label?: string
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  options: readonly UiSelectOption[]
  placeholder?: string
  isDisabled?: boolean
  layout?: 'vertical' | 'inline'
  className?: string
  triggerClassName?: string
}) {
  return (
    <Select
      aria-label={label ? undefined : ariaLabel}
      isDisabled={isDisabled}
      placeholder={placeholder}
      value={encodeKey(value)}
      onChange={(next) => onChange(decodeKey(next))}
      className={cn(
        'group/select min-w-0',
        layout === 'inline' ? 'flex flex-wrap items-center gap-2.5' : 'flex flex-col gap-1.5',
        className
      )}
    >
      {label && (
        <Label className="shrink-0 text-xs font-medium text-muted-foreground">{label}</Label>
      )}
      <Button
        className={cn(
          'inline-flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-sm border border-input bg-card px-3 text-left text-sm text-foreground outline-none transition-colors hover:border-strong data-[open]:border-primary data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-ring data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:text-muted-foreground',
          triggerClassName
        )}
      >
        <SelectValue className="min-w-0 flex-1 truncate data-[placeholder]:text-muted-foreground" />
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[open]/select:rotate-180"
        />
      </Button>
      <Popover
        offset={4}
        className="z-[60] max-h-72 w-[var(--trigger-width)] min-w-[9rem] overflow-y-auto slim-scrollbar rounded-sm border border-strong bg-popover p-1 text-popover-foreground shadow-lg outline-none"
      >
        <ListBox className="outline-none">
          {options.map((opt) => (
            <ListBoxItem
              key={encodeKey(opt.value)}
              id={encodeKey(opt.value)}
              textValue={opt.label}
              className="flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-sm text-popover-foreground outline-none transition-colors data-[hovered]:bg-accent data-[focused]:bg-accent data-[selected]:font-semibold data-[selected]:text-primary"
            >
              {({ isSelected }) => (
                <>
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {isSelected && (
                    <Check aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                  )}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  )
}
