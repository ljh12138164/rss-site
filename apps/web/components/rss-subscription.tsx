'use client'

import { listSignalSections, listSignalSources } from '@rss-site/signals'
import { Rss, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { rssSourcesPath } from '../lib/rss-selection'
import { ActionButton } from './action-button'

export function RssSubscription({
  basePath,
  sectionName
}: {
  basePath: string
  sectionName: string
}) {
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'section' | 'custom'>('section')
  const [selected, setSelected] = useState<string[]>([])
  const [filterSection, setFilterSection] = useState(basePath.slice(1))
  const customAddress =
    mode === 'custom' && selected.length ? new URL(rssSourcesPath(selected), address).href : ''
  const currentAddress = mode === 'section' ? address : customAddress

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(currentAddress)
      setMessage('已复制订阅地址，请粘贴到阅读器。')
    } catch {
      setMessage('无法自动复制，请选择上方地址并手动复制。')
    }
  }

  return (
    <DialogTrigger
      onOpenChange={(open) => {
        if (open) {
          setAddress(new URL(`/feeds${basePath}.xml`, window.location.origin).href)
          setMode('section')
          setSelected([])
          setFilterSection(basePath.slice(1))
          setMessage('')
        }
      }}
    >
      <ActionButton
        variant="outline"
        className="mt-4 focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`订阅${sectionName}分区 RSS`}
      >
        <Rss size={16} aria-hidden="true" />
        RSS 订阅
      </ActionButton>
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      >
        <Modal className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg">
          <Dialog className="max-h-[calc(var(--visual-viewport-height,100dvh)-2rem)] overflow-y-auto p-5 outline-none sm:p-6 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-primary">
            {({ close }) => (
              <>
                <div className="flex items-center justify-between gap-3">
                  <Heading slot="title" className="min-w-0 text-xl font-semibold">
                    订阅{sectionName}分区
                  </Heading>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    aria-label="关闭订阅弹窗"
                    onPress={close}
                  >
                    <X size={20} aria-hidden="true" />
                  </ActionButton>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  订阅整个分区，或组合喜欢的平台，在你的 RSS 阅读器中查看更新。
                </p>
                <fieldset className="mt-4 flex flex-wrap gap-4 text-sm">
                  <legend className="sr-only">订阅范围</legend>
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="radio"
                      name="rss-scope"
                      checked={mode === 'section'}
                      onChange={() => {
                        setMode('section')
                        setMessage('')
                      }}
                    />
                    整个{sectionName}分区
                  </label>
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="radio"
                      name="rss-scope"
                      checked={mode === 'custom'}
                      onChange={() => {
                        setMode('custom')
                        setMessage('')
                      }}
                    />
                    自选平台
                  </label>
                </fieldset>
                {mode === 'custom' && (
                  <div className="mt-3">
                    <label className="flex flex-wrap items-center gap-3 text-sm">
                      平台分区
                      <select
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                        className="min-h-11 rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <option value="">全部分区</option>
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
                    <fieldset className="mt-3 max-h-56 overflow-y-auto rounded-md border border-border p-3">
                      <legend className="px-1 text-xs text-muted-foreground">
                        已选择 <span className="tabular-nums">{selected.length}</span>{' '}
                        个平台，可跨分区组合
                      </legend>
                      {listSignalSources({ isArticle: true })
                        .filter((source) => !filterSection || source.section === filterSection)
                        .map((source) => (
                          <label
                            key={source.id}
                            className="flex min-h-11 min-w-0 items-center gap-2 text-sm"
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
                <label className="mt-5 block text-sm font-medium" htmlFor="rss-address">
                  订阅地址
                </label>
                <input
                  id="rss-address"
                  readOnly
                  value={currentAddress}
                  placeholder="请选择至少一个平台"
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-2 min-h-11 w-full min-w-0 rounded-sm border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                />
                <ActionButton
                  className="mt-3"
                  isDisabled={!currentAddress}
                  onPress={() => void copyAddress()}
                >
                  复制订阅地址
                </ActionButton>
                <p role="status" className="mt-2 min-h-6 text-sm leading-6 text-muted-foreground">
                  {message}
                </p>
                <h3 className="mt-4 font-medium">如何配置</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>复制上方订阅地址。</li>
                  <li>打开你的 RSS 阅读器，找到“添加订阅”或“添加 Feed”。</li>
                  <li>粘贴地址，确认添加，即可在阅读器中查看本分区的更新。</li>
                </ol>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  {mode === 'section'
                    ? '此地址包含整个分区的内容。'
                    : '此地址仅包含选中的平台，组合保存在订阅地址中。'}
                  阅读器会按自己的刷新频率获取更新。
                </p>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
