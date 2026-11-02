import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

// Exercise native fetch validation in the workerd bundled with the locked Wrangler.
const require = createRequire(import.meta.url)
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'))
const { build } = wranglerRequire('esbuild')
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare')
const upstream = vi.fn(async (request: Request) => {
  if (new URL(request.url).pathname === '/redirect')
    return new Response(null, { status: 302, headers: { Location: 'https://other.test/' } })
  return Response.json({ ok: true })
})
let worker: InstanceType<typeof Miniflare>

beforeAll(async () => {
  const built = await build({
    stdin: {
      contents: `
        import { requestJson } from './zhihu.ts';
        export default {
          async fetch(request) {
            try {
              const response = await requestJson(fetch,
                'https://upstream.test' + new URL(request.url).pathname,
                { headers: { Cookie: 'z_c0=synthetic' } });
              return Response.json(await response.json());
            } catch(error) {
              return Response.json({ code: error.code ?? error.name }, { status: 502 });
            }
          }
        };
      `,
      resolveDir: fileURLToPath(new URL('.', import.meta.url)),
      loader: 'ts'
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false
  })
  worker = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: built.outputFiles[0].text,
      compatibilityDate: '2026-09-11',
      outboundService: upstream
    })
  )
})

afterAll(async () => {
  await worker?.dispose()
})

it('executes the maintenance request helper through native Workers fetch', async () => {
  const response = await worker.dispatchFetch('https://worker.test/ok')
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ ok: true })
})

it('rejects a redirect in workerd without sending a second credential-bearing request', async () => {
  upstream.mockClear()
  const response = await worker.dispatchFetch('https://worker.test/redirect')
  expect(response.status).toBe(502)
  expect(await response.json()).toEqual({ code: 'upstream_http_302' })
  expect(upstream).toHaveBeenCalledOnce()
})
