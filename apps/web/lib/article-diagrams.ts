const DIAGRAM_START =
  /^(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\b|^(?:sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart)\b/
let diagramId = 0

function decodeDiagramEntities(source: string) {
  const named: Record<string, string> = { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' }
  return source.replace(/&(#(?:x[\da-f]+|\d+)|quot|apos|amp|lt|gt);/gi, (entity, value: string) => {
    if (!value.startsWith('#')) return named[value.toLowerCase()]
    const point =
      value[1].toLowerCase() === 'x'
        ? Number.parseInt(value.slice(2), 16)
        : Number.parseInt(value.slice(1), 10)
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point)
      : entity
  })
}

export function renderArticleDiagrams(root: HTMLElement, dark: boolean) {
  let disposed = false
  const replacements: { pre: HTMLPreElement; figure: HTMLElement }[] = []
  const blocks = Array.from(root.querySelectorAll('pre')).flatMap((pre) => {
    const code = pre.querySelector('code') ?? pre
    const source = decodeDiagramEntities(code.textContent ?? '').trim()
    const header = source.replace(/^(?:%%[^\n]*\n\s*)+/, '')
    if (
      source.length > 20000 ||
      !(code.matches('.language-mermaid, .lang-mermaid') || DIAGRAM_START.test(header))
    )
      return []
    // Correct historical double encoding as text, never as executable HTML.
    code.textContent = source
    return [{ pre, source }]
  })

  async function render() {
    if (!blocks.length) return
    const mermaid = (await import('mermaid')).default
    if (disposed) return
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      maxTextSize: 20000,
      maxEdges: 200,
      htmlLabels: false,
      flowchart: { htmlLabels: false },
      theme: dark ? 'dark' : 'default',
      fontFamily: 'inherit',
      look: 'classic',
      layout: 'dagre',
      secure: [
        'secure',
        'securityLevel',
        'startOnLoad',
        'suppressErrorRendering',
        'maxTextSize',
        'maxEdges',
        'htmlLabels',
        'flowchart',
        'themeCSS',
        'themeVariables',
        'fontFamily',
        'dompurifyConfig',
        'layout',
        'look',
        'theme'
      ]
    })
    for (const { pre, source } of blocks) {
      if (disposed || !root.contains(pre)) return
      try {
        const { svg } = await mermaid.render(`article-diagram-${diagramId++}`, source)
        if (disposed || !root.contains(pre)) return
        const figure = root.ownerDocument.createElement('figure')
        figure.setAttribute('aria-label', '文章图表')
        figure.tabIndex = 0
        figure.className =
          'my-6 max-w-full overflow-x-auto rounded-lg border border-border bg-card p-4 focus-visible:outline-2 focus-visible:outline-primary [&_svg]:mx-auto [&_svg]:h-auto'
        // Mermaid sanitizes its SVG in strict mode; do not bind source-defined callbacks.
        figure.innerHTML = svg
        const drawing = figure.querySelector('svg')
        const width = Number(drawing?.getAttribute('viewBox')?.split(/\s+/)[2])
        if (drawing && Number.isFinite(width) && width > 0) {
          drawing.style.width = `${width}px`
          drawing.style.maxWidth = 'none'
        }
        pre.replaceWith(figure)
        replacements.push({ pre, figure })
      } catch {
        // Invalid or unsupported upstream diagrams remain readable as source.
      }
    }
  }
  void render().catch(() => {}) // A failed chunk download must not hide the article.
  return () => {
    disposed = true
    for (const { pre, figure } of replacements) {
      if (root.contains(figure)) figure.replaceWith(pre)
    }
  }
}
