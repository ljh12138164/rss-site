'use client'

import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import { type ActionSize, type ActionVariant, actionStyles } from './action-styles'

interface ActionButtonProps extends Omit<AriaButtonProps, 'className'> {
  className?: string
  size?: ActionSize
  variant?: ActionVariant
}

export function ActionButton({
  className,
  size = 'default',
  variant = 'primary',
  ...props
}: ActionButtonProps) {
  return <AriaButton className={actionStyles(variant, size, className)} {...props} />
}
