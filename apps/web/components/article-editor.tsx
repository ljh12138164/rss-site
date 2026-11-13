'use client'

import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'
import { Button as AriaButton, ToggleButton } from 'react-aria-components'
import { cn } from '../lib/utils'
import { ActionButton } from './action-button'
import { UiSegmentedGroup } from './ui/segmented-group'
import { UiTextArea, UiTextField } from './ui/text-field'

export function ArticleEditor({
  value,
  onChange,
  disabled = false
}: {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}) {
  const hasEmbeddedVideo = /data-cctv-video|<(?:iframe|video|audio)\b/i.test(value)
  const [sourceMode, setSourceMode] = useState(hasEmbeddedVideo)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image, TableKit],
    content: value,
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': '正文富文本',
        'aria-multiline': 'true',
        class:
          'min-h-72 max-h-[60dvh] overflow-y-auto p-4 text-sm leading-7 outline-none [&_p]:my-3 [&_h2]:my-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_code]:font-mono [&_img]:max-w-full [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2'
      }
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML())
  })
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive('bold'),
            italic: current.isActive('italic'),
            heading: current.isActive('heading', { level: 2 }),
            bulletList: current.isActive('bulletList'),
            orderedList: current.isActive('orderedList'),
            blockquote: current.isActive('blockquote'),
            link: current.isActive('link')
          }
        : null
  })
  useEffect(() => {
    if (editor && editor.getHTML() !== value)
      editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])
  useEffect(() => {
    editor?.setEditable(!disabled, false)
  }, [editor, disabled])

  function applyLink() {
    try {
      const url = new URL(linkUrl)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
        throw new Error()
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url.href }).run()
      setLinkOpen(false)
      setLinkError('')
    } catch {
      setLinkError('请输入完整的 http 或 https 链接。')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">正文</p>
        <UiSegmentedGroup
          ariaLabel="正文编辑模式"
          value={sourceMode || hasEmbeddedVideo ? 'source' : 'rich'}
          onChange={(next) => {
            setSourceMode(next === 'source')
            setLinkOpen(false)
          }}
          options={[
            { value: 'rich', label: '富文本', isDisabled: disabled || hasEmbeddedVideo },
            { value: 'source', label: '源码', isDisabled: disabled }
          ]}
        />
      </div>
      {hasEmbeddedVideo && (
        <p className="text-xs text-muted-foreground">
          本文包含视频嵌入，请使用源码模式保留播放器。
        </p>
      )}
      {sourceMode || hasEmbeddedVideo ? (
        <UiTextArea
          ariaLabel="正文 HTML 源码"
          isDisabled={disabled}
          value={value}
          onChange={onChange}
          textAreaClassName="font-mono text-xs"
        />
      ) : (
        <div className="overflow-hidden rounded-sm border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
          <div
            role="toolbar"
            aria-label="正文排版工具"
            className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2"
          >
            {[
              {
                label: '加粗',
                pressed: Boolean(active?.bold),
                run: () => editor?.chain().focus().toggleBold().run()
              },
              {
                label: '斜体',
                pressed: Boolean(active?.italic),
                run: () => editor?.chain().focus().toggleItalic().run()
              },
              {
                label: '标题',
                pressed: Boolean(active?.heading),
                run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run()
              },
              {
                label: '无序列表',
                pressed: Boolean(active?.bulletList),
                run: () => editor?.chain().focus().toggleBulletList().run()
              },
              {
                label: '有序列表',
                pressed: Boolean(active?.orderedList),
                run: () => editor?.chain().focus().toggleOrderedList().run()
              },
              {
                label: '引用',
                pressed: Boolean(active?.blockquote),
                run: () => editor?.chain().focus().toggleBlockquote().run()
              },
              {
                label: '链接',
                pressed: Boolean(active?.link),
                run: () => {
                  setLinkUrl(editor?.getAttributes('link').href ?? '')
                  setLinkError('')
                  setLinkOpen(!linkOpen)
                }
              }
            ].map(({ label, pressed, run }) => (
              <ToggleButton
                key={label}
                isDisabled={disabled || !editor}
                isSelected={pressed}
                onChange={run}
                className={cn(
                  'min-h-9 cursor-pointer rounded-sm px-2.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[selected]:bg-primary/15 data-[selected]:font-semibold data-[selected]:text-primary data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40'
                )}
              >
                {label}
              </ToggleButton>
            ))}
            {[
              { label: '撤销', run: () => editor?.chain().focus().undo().run() },
              { label: '重做', run: () => editor?.chain().focus().redo().run() }
            ].map(({ label, run }) => (
              <AriaButton
                key={label}
                isDisabled={disabled || !editor}
                onPress={run}
                className="min-h-9 cursor-pointer rounded-sm px-2.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
              >
                {label}
              </AriaButton>
            ))}
          </div>
          {linkOpen && (
            <div className="space-y-2 border-b border-border p-3">
              <UiTextField
                label="链接地址"
                type="url"
                value={linkUrl}
                isDisabled={disabled}
                onChange={setLinkUrl}
                placeholder="https://"
              />
              <div className="flex flex-wrap gap-2">
                <ActionButton isDisabled={disabled} onPress={applyLink}>
                  应用链接
                </ActionButton>
                <ActionButton
                  variant="outline"
                  isDisabled={disabled}
                  onPress={() => {
                    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
                    setLinkOpen(false)
                  }}
                >
                  移除链接
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onPress={() => {
                    setLinkOpen(false)
                    setLinkError('')
                  }}
                >
                  取消
                </ActionButton>
              </div>
              {linkError && (
                <p role="alert" className="text-xs text-destructive">
                  {linkError}
                </p>
              )}
            </div>
          )}
          {!editor && (
            <p role="status" className="p-4 text-sm text-muted-foreground">
              正在加载编辑器…
            </p>
          )}
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}
