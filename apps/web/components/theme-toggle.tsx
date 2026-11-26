'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Tooltip, TooltipTrigger } from 'react-aria-components'
import { ActionButton } from './action-button'
import { useSiteText } from './site-language'

export function ThemeToggle({ className }: { className?: string }) {
  const t = useSiteText()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === 'dark'

  return (
    <TooltipTrigger delay={350}>
      <ActionButton
        aria-label={dark ? t('切换为浅色') : t('切换为深色')}
        className={
          className ??
          'size-9 rounded-sm border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground'
        }
        isDisabled={!mounted}
        onPress={() => setTheme(dark ? 'light' : 'dark')}
        size="icon"
        variant="ghost"
      >
        {dark ? (
          <Sun className="size-4" aria-hidden="true" />
        ) : (
          <Moon className="size-4" aria-hidden="true" />
        )}
      </ActionButton>
      <Tooltip
        className="z-50 rounded-sm border border-border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-sm"
        offset={8}
      >
        {dark ? t('浅色白瓷') : t('午夜深蓝')}
      </Tooltip>
    </TooltipTrigger>
  )
}
