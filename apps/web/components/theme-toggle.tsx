'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={dark ? '切换为浅色主题' : '切换为深色主题'}
          className="text-muted-foreground hover:text-foreground"
          disabled={!mounted}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          size="icon-sm"
          variant="ghost"
        >
          {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{dark ? '浅色主题' : '深色主题'}</TooltipContent>
    </Tooltip>
  )
}
