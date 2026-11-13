'use client'

import { listSignalSections, listSignalSources } from '@rss-site/signals'
import { Rss, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { rssSourcesPath } from '../lib/rss-selection'
import { ActionButton } from './action-button'

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
  const [address, setAddress] = useState('')
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

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(currentAddress)
      setMessage('已复制')
    } catch {
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
          setMessage('')
        }
      }}
    >
      {triggerVariant === 'topbar' ? (
        <ActionButton
          variant="ghost"
          aria-label="RSS 订阅"
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
          aria-label={`订阅 ${sectionName} RSS`}
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
          <Dialog className="max-h-[calc(var(--visual-viewport-height,100dvh)-2rem)] overflow-y-auto p-5 outline-none sm:p-6 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-ring">
            {({ close }) => (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <Heading slot="title" className="min-w-0 text-lg font-semibold">
                    RSS 订阅
                  </Heading>
                  <ActionButton variant="ghost" size="icon" aria-label="关闭弹窗" onPress={close}>
                    <X size={18} aria-hidden="true" />
                  </ActionButton>
                </div>
                <fieldset className="mt-4 flex flex-wrap gap-5 text-sm">
                  <legend className="sr-only">订阅范围</legend>
                  <label className="flex min-h-10 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="rss-scope"
                      checked={mode === 'section'}
                      onChange={() => {
                        setMode('section')
                        setMessage('')
                      }}
                    />
                    整个频道
                  </label>
                  <label className="flex min-h-10 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="rss-scope"
                      checked={mode === 'custom'}
                      onChange={() => {
                        setMode('custom')
                        setMessage('')
                      }}
                    />
                    自选来源
                  </label>
                </fieldset>
                {mode === 'section' ? (
                  <div className="mt-3">
                    <label className="block text-xs text-muted-foreground">
                      频道
                      <select
                        value={selectedSection}
                        onChange={(e) => {
                          setSelectedSection(e.target.value)
                          setMessage('')
                        }}
                        className="mt-1 min-h-10 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {listSignalSections()
                          .filter(
                            (s) => listSignalSources({ section: s.id, isArticle: true }).length
                          )
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      按频道筛选
                      <select
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                        className="min-h-10 rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <option value="">全部频道</option>
                        {listSignalSections()
                          .filter(
                            (section) =>
                              listSignalSources({ section: section.id, isArticle: true }).length
                          )
                          .map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.title}
                            </option>
                          ))}
                      </select>
                    </label>
                    <fieldset className="mt-3 max-h-52 overflow-y-auto rounded-sm border border-border bg-card p-3">
                      <legend className="px-1 font-mono text-xs text-muted-foreground tabular-nums">
                        已选 {selected.length}
                      </legend>
                      {listSignalSources({ isArticle: true })
                        .filter((source) => !filterSection || source.section === filterSection)
                        .map((source) => (
                          <label
                            key={source.id}
                            className="flex min-h-9 min-w-0 cursor-pointer items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(source.id)}
                              onChange={(e) => {
                                setSelected((current) =>
                                  e.target.checked
                                    ? [...current, source.id]
                                    : current.filter((id) => id !== source.id)
                                )
                                setMessage('')
                              }}
                            />
                            <span className="truncate" title={source.name}>
                              {source.name}
                            </span>
                          </label>
                        ))}
                    </fieldset>
                  </div>
                )}
                <label className="mt-4 block text-xs text-muted-foreground" htmlFor="rss-address">
                  Feed 地址
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="rss-address"
                    readOnly
                    value={currentAddress}
                    placeholder="请选择至少一个来源"
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-h-10 min-w-0 flex-1 rounded-sm border border-input bg-card px-3 font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring"
                  />
                  <ActionButton isDisabled={!currentAddress} onPress={() => void copyAddress()}>
                    复制
                  </ActionButton>
                </div>
                <p role="status" className="mt-2 min-h-5 font-mono text-xs text-primary">
                  {message}
                </p>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
