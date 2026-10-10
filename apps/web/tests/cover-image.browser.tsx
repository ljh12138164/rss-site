import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { CoverImage } from '../components/cover-image'

const container = document.getElementById('cover-root') as HTMLDivElement
const root = createRoot(container)
const result = document.getElementById('result') as HTMLParagraphElement

async function waitForImage(src: string) {
  const deadline = Date.now() + 3000
  while (Date.now() < deadline) {
    const image = container.querySelector('img')
    if (image?.getAttribute('src') === src && image.complete && image.naturalWidth > 0) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(
    `Expected loaded image ${src}; received ${container.querySelector('img')?.getAttribute('src')}`
  )
}

;(document.getElementById('run-check') as HTMLButtonElement).onclick = async () => {
  result.textContent = 'Running'
  try {
    flushSync(() =>
      root.render(
        <CoverImage
          src="/missing-cover.png"
          fallbackSrc="/source-icons/geekpark.svg"
          loading="eager"
        />
      )
    )
    await waitForImage('/source-icons/geekpark.svg')
    flushSync(() =>
      root.render(
        <CoverImage src="/missing-cover.png" fallbackSrc="/missing-default.svg" loading="eager" />
      )
    )
    await waitForImage('/article-cover-default.svg')
    flushSync(() => root.render(<CoverImage src="/source-icons/ithome.png" loading="eager" />))
    await waitForImage('/source-icons/ithome.png')
    flushSync(() =>
      root.render(<CoverImage fallbackSrc="/source-icons/geekpark.svg" loading="eager" />)
    )
    await waitForImage('/source-icons/geekpark.svg')
    flushSync(() =>
      root.render(
        <CoverImage
          src="/another-missing-cover.png"
          loading="eager"
          fallback={
            <span role="img" aria-label="Platform icon">
              平台图标
            </span>
          }
        />
      )
    )
    const deadline = Date.now() + 3000
    while (!container.querySelector('[aria-label="Platform icon"]') && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    if (!container.querySelector('[aria-label="Platform icon"]'))
      throw new Error('Expected platform icon fallback')
    flushSync(() => root.render(<CoverImage src="/source-icons/ithome.png" loading="eager" />))
    await waitForImage('/source-icons/ithome.png')
    result.textContent = 'PASS: loading error, invalid fallback, changed cover and changed fallback'
  } catch (error) {
    result.textContent = `FAIL: ${(error as Error).message}`
  }
}
