// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderArticleDiagrams } from './article-diagrams'

const { initialize, render } = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }))
vi.mock('mermaid', () => ({ default: { initialize, render } }))

const historicalFlowchart = `<pre><code>flowchart LR
  subgraph MESH[&amp;#34;Mesh 数据面（Envoy Sidecar）&amp;#34;]
    T[&amp;#34;分布式追踪&lt;br/&gt;Trace Context 传播&amp;#34;]
  end
  T --&gt; T2[&amp;#34;Tempo / Jaeger&amp;#34;]
</code></pre>`
const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Mesh 数据面</text></svg>'
let root: HTMLDivElement
let cleanup: (() => void) | undefined

beforeEach(() => {
  vi.clearAllMocks()
  render.mockResolvedValue({ svg })
  root = document.createElement('div')
  document.body.append(root)
})
afterEach(() => {
  cleanup?.()
  cleanup = undefined
  root.remove()
})

describe('article diagrams', () => {
  it('renders a historical unlabelled Juejin flowchart and recovers encoded quotes', async () => {
    root.innerHTML = `<p>下面这张图概括方案：</p>${historicalFlowchart}<p>正文继续。</p>`
    cleanup = renderArticleDiagrams(root, false)
    await vi.waitFor(() => expect(root.querySelector('[aria-label="文章图表"] svg')).not.toBeNull())
    expect(render).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('MESH["Mesh 数据面（Envoy Sidecar）"]')
    )
    expect(render.mock.calls[0][1]).toContain('T["分布式追踪<br/>Trace Context 传播"]')
    expect(root.textContent).toContain('正文继续。')
    expect(root.querySelector('pre')).toBeNull()
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ securityLevel: 'strict', startOnLoad: false, htmlLabels: false })
    )
  })

  it('leaves ordinary code unchanged without initializing Mermaid', async () => {
    root.innerHTML = '<pre><code>const graph = "flowchart LR"; &amp;#34;</code></pre>'
    const original = root.innerHTML
    cleanup = renderArticleDiagrams(root, false)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(root.innerHTML).toBe(original)
    expect(initialize).not.toHaveBeenCalled()
  })

  it('supports explicitly marked diagrams and matches the current theme', async () => {
    root.innerHTML = '<pre><code class="language-mermaid">%% a diagram\npie\n"一" : 1</code></pre>'
    cleanup = renderArticleDiagrams(root, true)
    await vi.waitFor(() => expect(root.querySelector('svg')).not.toBeNull())
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }))
  })

  it('keeps readable source when rendering fails', async () => {
    render.mockRejectedValue(new Error('Invalid diagram'))
    root.innerHTML = historicalFlowchart
    cleanup = renderArticleDiagrams(root, false)
    await vi.waitFor(() => expect(render).toHaveBeenCalled())
    expect(root.querySelector('pre')?.textContent).toContain('MESH["Mesh 数据面（Envoy Sidecar）"]')
    expect(root.querySelector('svg')).toBeNull()
  })

  it('does not insert a diagram after the article has unmounted', async () => {
    let complete: ((result: { svg: string }) => void) | undefined
    render.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve
        })
    )
    root.innerHTML = historicalFlowchart
    cleanup = renderArticleDiagrams(root, false)
    await vi.waitFor(() => expect(render).toHaveBeenCalled())
    cleanup()
    complete?.({ svg })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(root.querySelector('svg')).toBeNull()
  })

  it('restores source on cleanup so a theme change can redraw the diagram', async () => {
    root.innerHTML = historicalFlowchart
    cleanup = renderArticleDiagrams(root, false)
    await vi.waitFor(() => expect(root.querySelector('svg')).not.toBeNull())
    cleanup()
    expect(root.querySelector('pre')).not.toBeNull()
    cleanup = renderArticleDiagrams(root, true)
    await vi.waitFor(() => expect(root.querySelector('svg')).not.toBeNull())
    expect(initialize).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'dark' }))
  })
})
