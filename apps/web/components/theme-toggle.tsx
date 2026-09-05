'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Tooltip, TooltipTrigger } from 'react-aria-components'
import { ActionButton } from './action-button'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === 'dark'

  return (
    <TooltipTrigger delay={350}>
      <ActionButton
        aria-label={dark ? '切换为浅色主题' : '切换为深色主题'}
        className="size-11 text-muted-foreground hover:text-foreground"
        isDisabled={!mounted}
        onPress={() => setTheme(dark ? 'light' : 'dark')}
        size="icon"
        variant="ghost"
      >
        {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </ActionButton>
      <Tooltip
        className="z-50 rounded-sm bg-foreground px-3 py-1.5 text-xs text-background shadow-sm"
        offset={8}
      >
        {dark ? '浅色主题' : '深色主题'}
      </Tooltip>
    </TooltipTrigger>
  )
}
