'use client'

import type { FocusEventHandler } from 'react'
import { Input, Label, TextArea, TextField } from 'react-aria-components'
import { cn } from '../../lib/utils'

const fieldInputBase =
  'w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-strong focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:text-muted-foreground'

export function UiTextField({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  type = 'text',
  isReadOnly = false,
  isDisabled = false,
  maxLength,
  onFocus,
  className,
  inputClassName
}: {
  id?: string
  label?: string
  ariaLabel?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  type?: string
  isReadOnly?: boolean
  isDisabled?: boolean
  maxLength?: number
  onFocus?: FocusEventHandler<HTMLInputElement>
  className?: string
  inputClassName?: string
}) {
  return (
    <TextField
      aria-label={label ? undefined : ariaLabel}
      value={value}
      onChange={onChange}
      isReadOnly={isReadOnly}
      isDisabled={isDisabled}
      className={cn('min-w-0', className)}
    >
      {label && (
        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      )}
      <Input
        id={id}
        type={type}
        maxLength={maxLength}
        placeholder={placeholder}
        onFocus={onFocus}
        className={cn('h-10', fieldInputBase, inputClassName)}
      />
    </TextField>
  )
}

export function UiTextArea({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  isDisabled = false,
  className,
  textAreaClassName
}: {
  id?: string
  label?: string
  ariaLabel?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  isDisabled?: boolean
  className?: string
  textAreaClassName?: string
}) {
  return (
    <TextField
      aria-label={label ? undefined : ariaLabel}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      className={cn('min-w-0', className)}
    >
      {label && (
        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      )}
      <TextArea
        id={id}
        placeholder={placeholder}
        className={cn('min-h-72 p-4 leading-6', fieldInputBase, textAreaClassName)}
      />
    </TextField>
  )
}
