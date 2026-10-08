'use client'

import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import { ActionButton } from './action-button'

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
        <fieldset className="flex gap-2" aria-label="正文编辑模式">
          <ActionButton
            variant={sourceMode ? 'outline' : 'primary'}
            isDisabled={disabled || hasEmbeddedVideo}
            aria-pressed={!sourceMode}
            onPress={() => {
              setSourceMode(false)
              setLinkOpen(false)
            }}
          >
            富文本
          </ActionButton>
          <ActionButton
            variant={sourceMode ? 'primary' : 'outline'}
            isDisabled={disabled}
            aria-pressed={sourceMode}
            onPress={() => {
              setSourceMode(true)
              setLinkOpen(false)
            }}
          >
            源码
          </ActionButton>
        </fieldset>
      </div>
      {hasEmbeddedVideo && (
        <p className="text-xs text-muted-foreground">
          本文包含视频嵌入，请使用源码模式保留播放器。
        </p>
      )}
      {sourceMode || hasEmbeddedVideo ? (
        <textarea
          aria-label="正文 HTML 源码"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-72 w-full rounded-md border border-input bg-background p-4 font-mono text-xs leading-6 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-primary">
          <fieldset
            aria-label="正文排版工具"
            className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2"
          >
            {[
              {
                label: '加粗',
                pressed: active?.bold,
                run: () => editor?.chain().focus().toggleBold().run()
              },
              {
                label: '斜体',
                pressed: active?.italic,
                run: () => editor?.chain().focus().toggleItalic().run()
              },
              {
                label: '标题',
                pressed: active?.heading,
                run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run()
              },
              {
                label: '无序列表',
                pressed: active?.bulletList,
                run: () => editor?.chain().focus().toggleBulletList().run()
              },
              {
                label: '有序列表',
                pressed: active?.orderedList,
                run: () => editor?.chain().focus().toggleOrderedList().run()
              },
              {
                label: '引用',
                pressed: active?.blockquote,
                run: () => editor?.chain().focus().toggleBlockquote().run()
              },
              {
                label: '链接',
                pressed: active?.link,
                run: () => {
                  setLinkUrl(editor?.getAttributes('link').href ?? '')
                  setLinkError('')
                  setLinkOpen(!linkOpen)
                }
              },
              { label: '撤销', run: () => editor?.chain().focus().undo().run() },
              { label: '重做', run: () => editor?.chain().focus().redo().run() }
            ].map(({ label, pressed, run }) => (
              <button
                key={label}
                type="button"
                disabled={disabled || !editor}
                aria-pressed={pressed}
                onClick={run}
                className={cn(
                  'min-h-9 rounded px-2 text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40',
                  pressed && 'bg-primary/15 text-primary'
                )}
              >
                {label}
              </button>
            ))}
          </fieldset>
          {linkOpen && (
            <div className="space-y-2 border-b border-border p-3">
              <label className="block text-xs">
                链接地址
                <input
                  type="url"
                  value={linkUrl}
                  disabled={disabled}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://"
                  className="mt-1 min-h-10 w-full rounded border border-input bg-background px-3 text-sm"
                />
              </label>
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
