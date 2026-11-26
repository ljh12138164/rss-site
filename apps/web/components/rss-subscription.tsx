'use client'

import { listSignalSections, listSignalSources } from '@rss-site/signals'
import { Check, Copy, Rss, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { rssSourcesPath } from '../lib/rss-selection'
import { ActionButton } from './action-button'
import { useSiteText } from './site-language'
import { SourceIcon } from './source-icon'
import { UiCheckbox, UiCheckboxGroup } from './ui/checkbox'
import { UiRadio, UiRadioGroup } from './ui/radio-group'
import { UiSelect } from './ui/select'
import { UiTextField } from './ui/text-field'

const articleSections = listSignalSections().filter(
  (section) => listSignalSources({ section: section.id, isArticle: true }).length > 0
)

const articleSources = listSignalSources({ isArticle: true })

export function RssSubscription({
  basePath = '/ai',
  sectionName = 'AI',
  triggerVariant = 'button',
  defaultMode = 'section',
  className
}: {
  basePath?: string
  sectionName?: string
  triggerVariant?: 'button' | 'topbar'
  defaultMode?: 'section' | 'custom'
  className?: string
}) {
  const t = useSiteText()
  const [address, setAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'section' | 'custom'>(defaultMode)
  const [selectedSection, setSelectedSection] = useState(basePath.slice(1))
  const [selected, setSelected] = useState<string[]>([])
  const [filterSection, setFilterSection] = useState('')

  const sectionAddress = address ? new URL(`/feeds/${selectedSection}.xml`, address).href : ''
  const customAddress =
    mode === 'custom' && selected.length && address
      ? new URL(rssSourcesPath(selected), address).href
      : ''
  const currentAddress = mode === 'section' ? sectionAddress : customAddress
  const visibleSources = articleSources.filter(
    (source) => !filterSection || source.section === filterSection
  )

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(currentAddress)
      setCopied(true)
      setMessage('已复制订阅地址')
    } catch {
      setCopied(false)
      setMessage('请手动复制上方地址')
    }
  }

  return (
    <DialogTrigger
      onOpenChange={(open) => {
        if (open) {
          setAddress(window.location.origin)
          setMode(defaultMode)
          setSelectedSection(basePath.slice(1))
          setSelected([])
          setFilterSection(defaultMode === 'custom' ? '' : basePath.slice(1))
          setCopied(false)
          setMessage('')
        }
      }}
    >
      {triggerVariant === 'topbar' ? (
        <ActionButton
          variant="ghost"
          aria-label={t('RSS 订阅')}
          className={
            className ??
            'h-9 rounded-sm border border-border bg-card px-2.5 text-xs font-mono text-foreground hover:border-primary/60 hover:text-primary'
          }
        >
          <Rss size={14} aria-hidden="true" />
          <span className="hidden sm:inline">RSS</span>
        </ActionButton>
      ) : (
        <ActionButton
          variant="outline"
          className={className ?? 'h-9 px-3 text-xs'}
          aria-label={t('订阅 {section} RSS', { section: t(sectionName) })}
        >
          <Rss size={14} aria-hidden="true" />
          RSS
        </ActionButton>
      )}
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      >
        <Modal className="w-full max-w-lg overflow-hidden rounded-sm border border-strong bg-popover text-popover-foreground shadow-2xl">
          <Dialog className="max-h-[calc(var(--visual-viewport-height,100dvh)-2rem)] overflow-y-auto slim-scrollbar p-5 outline-none sm:p-6">
            {({ close }) => (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <Heading slot="title" className="min-w-0 text-lg font-semibold">
                    {t('RSS 订阅')}
                  </Heading>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    aria-label={t('关闭弹窗')}
                    onPress={close}
                  >
                    <X size={18} aria-hidden="true" />
                  </ActionButton>
                </div>

                <UiRadioGroup
                  label={t('订阅范围')}
                  value={mode}
                  onChange={(next) => {
                    setMode(next as 'section' | 'custom')
                    setCopied(false)
                    setMessage('')
                  }}
                  className="mt-4"
                >
                  <UiRadio value="section">{t('整个频道')}</UiRadio>
                  <UiRadio value="custom">{t('自选来源')}</UiRadio>
                </UiRadioGroup>

                {mode === 'section' ? (
                  <UiSelect
                    label={t('频道')}
                    value={selectedSection}
                    onChange={(next) => {
                      setSelectedSection(next)
                      setCopied(false)
                      setMessage('')
                    }}
                    options={articleSections.map((section) => ({
                      value: section.id,
                      label: t(section.title)
                    }))}
                    className="mt-4"
                  />
                ) : (
                  <div className="mt-4 space-y-3">
                    <UiSelect
                      label={t('按频道筛选')}
                      layout="inline"
                      value={filterSection}
                      onChange={setFilterSection}
                      options={[
                        { value: '', label: t('全部频道') },
                        ...articleSections.map((section) => ({
                          value: section.id,
                          label: t(section.title)
                        }))
                      ]}
                      triggerClassName="w-44"
                    />

                    <div className="overflow-hidden rounded-sm border border-border bg-card">
                      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
                        <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
                          {t('已选')} {selected.length} / {articleSources.length}
                        </span>
                        {selected.length > 0 && (
                          <ActionButton
                            variant="ghost"
                            size="default"
                            className="min-h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onPress={() => {
                              setSelected([])
                              setCopied(false)
                              setMessage('')
                            }}
                          >
                            {t('清空选择')}
                          </ActionButton>
                        )}
                      </div>
                      <UiCheckboxGroup
                        ariaLabel={t('选择订阅来源')}
                        value={selected}
                        onChange={(next) => {
                          setSelected(next)
                          setCopied(false)
                          setMessage('')
                        }}
                        className="max-h-52 divide-y divide-border/50 overflow-y-auto slim-scrollbar px-3 py-1"
                      >
                        {visibleSources.map((source) => (
                          <UiCheckbox key={source.id} value={source.id} className="py-1">
                            <SourceIcon source={source} className="size-4" />
                            <span className="truncate" title={source.name}>
                              {source.name}
                            </span>
                          </UiCheckbox>
                        ))}
                      </UiCheckboxGroup>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-1.5">
                  <label
                    className="block text-xs font-medium text-muted-foreground"
                    htmlFor="rss-address"
                  >
                    {t('Feed 地址')}
                  </label>
                  <div className="flex items-center gap-2">
                    <UiTextField
                      id="rss-address"
                      ariaLabel={t('Feed 地址')}
                      isReadOnly
                      value={currentAddress}
                      placeholder={t('请选择至少一个来源')}
                      onFocus={(event) => event.currentTarget.select()}
                      className="flex-1"
                      inputClassName="font-mono text-xs"
                    />
                    <ActionButton isDisabled={!currentAddress} onPress={() => void copyAddress()}>
                      {copied ? (
                        <Check className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                      {copied ? t('已复制') : t('复制')}
                    </ActionButton>
                  </div>
                </div>

                <p role="status" className="mt-2 min-h-5 font-mono text-xs text-primary">
                  {t(message)}
                </p>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
