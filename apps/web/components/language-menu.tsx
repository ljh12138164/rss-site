'use client'

import { Check, Languages } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components'
import { isSiteLocale } from '../lib/site-locale'
import { ActionButton } from './action-button'
import { useLanguagePreference } from './site-language'

export function LanguageMenu() {
  const { locale, preference, setPreference } = useLanguagePreference()
  const t = useTranslations('common')
  const label = t('language')
  const options = [
    { id: 'auto', label: t('followBrowser') },
    { id: 'zh-CN', label: '简体中文', lang: 'zh-CN' },
    { id: 'en', label: 'English', lang: 'en' }
  ]

  return (
    <MenuTrigger>
      <ActionButton
        variant="ghost"
        aria-label={`${label} · ${locale === 'en' ? 'English' : '简体中文'}`}
        className="relative size-9 min-h-9 gap-1.5 rounded-sm border border-border bg-card p-0 text-xs text-foreground hover:border-primary/60 hover:text-primary sm:w-auto sm:px-2.5 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
      >
        <Languages className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline" lang={locale}>
          {locale === 'en' ? 'English' : '简体中文'}
        </span>
      </ActionButton>
      <Popover
        placement="bottom end"
        offset={6}
        className="z-50 min-w-40 rounded-sm border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      >
        <Menu
          aria-label={label}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[preference]}
          onSelectionChange={(keys) => {
            if (keys === 'all') return
            const value = keys.values().next().value
            if (value === 'auto' || isSiteLocale(value)) setPreference(value)
          }}
          className="outline-none"
        >
          {options.map((option) => (
            <MenuItem
              key={option.id}
              id={option.id}
              textValue={option.label}
              className="flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 text-sm outline-none data-[focus-visible]:outline-2 data-[focus-visible]:-outline-offset-2 data-[focus-visible]:outline-ring data-[focus-visible]:outline-solid data-[focused]:bg-accent data-[selected]:font-semibold data-[selected]:text-primary pointer-coarse:min-h-11"
            >
              {({ isSelected }) => (
                <>
                  <span lang={option.lang}>{option.label}</span>
                  {isSelected && <Check className="size-4" aria-hidden="true" />}
                </>
              )}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}
