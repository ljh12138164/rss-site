import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { ArticleEditor } from './article-editor'

type CapturedOptions = {
  content: string
  immediatelyRender: boolean
  editable: boolean
  onUpdate: (event: { editor: { getHTML: () => string } }) => void
}
const editorOptions = vi.hoisted(() => ({
  current: {} as CapturedOptions,
  effects: [] as Array<() => void>,
  editor: null as null | {
    getHTML: () => string
    commands: { setContent: ReturnType<typeof vi.fn> }
    setEditable: ReturnType<typeof vi.fn>
  }
}))
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useEffect: (effect: () => void) => editorOptions.effects.push(effect)
}))
vi.mock('@tiptap/react', () => ({
  useEditor: (options: unknown) => {
    editorOptions.current = options as CapturedOptions
    return editorOptions.editor
  },
  EditorContent: () => null,
  useEditorState: () => null
}))

it('does not rewrite imported HTML before an edit, and sends HTML after an edit', () => {
  const onChange = vi.fn()
  const html = '<p>原文</p><table><tr><td>表格</td></tr></table>'
  renderToStaticMarkup(<ArticleEditor value={html} onChange={onChange} />)
  expect(editorOptions.current.content).toBe(html)
  expect(editorOptions.current.immediatelyRender).toBe(false)
  expect(onChange).not.toHaveBeenCalled()
  editorOptions.current.onUpdate({ editor: { getHTML: () => '<p><strong>修改</strong></p>' } })
  expect(onChange).toHaveBeenCalledWith('<p><strong>修改</strong></p>')
})

it('keeps source mode available while the editor loads and disables editing during save', () => {
  const markup = renderToStaticMarkup(<ArticleEditor value="" onChange={vi.fn()} disabled />)
  expect(markup).toContain('源码')
  expect(editorOptions.current.editable).toBe(false)
})

it('does not emit an HTML update when mounting or changing editable state', () => {
  editorOptions.effects = []
  const onChange = vi.fn()
  editorOptions.editor = {
    getHTML: () => '<p>正文</p>',
    commands: { setContent: vi.fn() },
    setEditable: vi.fn((_editable: boolean, emitUpdate = true) => {
      if (emitUpdate && editorOptions.editor)
        editorOptions.current.onUpdate({ editor: editorOptions.editor })
    })
  }
  renderToStaticMarkup(
    <ArticleEditor value={'<p>正文</p><div data-cctv-video="id"></div>'} onChange={onChange} />
  )
  editorOptions.effects.slice(0, 2).forEach((effect) => {
    effect()
  })
  expect(onChange).not.toHaveBeenCalled()
  expect(editorOptions.editor.setEditable).toHaveBeenCalledWith(true, false)
  editorOptions.effects = []
  renderToStaticMarkup(<ArticleEditor value="<p>正文</p>" onChange={onChange} disabled />)
  editorOptions.effects.slice(0, 2).forEach((effect) => {
    effect()
  })
  expect(editorOptions.editor.setEditable).toHaveBeenLastCalledWith(false, false)
  expect(onChange).not.toHaveBeenCalled()
  editorOptions.editor = null
})
