import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Reuse Vitest's existing Vite dependency for a real-browser component check.
const require = createRequire(import.meta.resolve('vitest/package.json'))
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href)
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('../', import.meta.url)),
  appType: 'custom',
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client'], force: true },
  server: { host: '127.0.0.1', port: 3011, strictPort: true },
  plugins: [
    {
      name: 'cover-image-check',
      configureServer(vite) {
        vite.middlewares.use('/__cover-image-check', (_request, response) => {
          response.setHeader('Content-Type', 'text/html')
          response.end(
            '<!doctype html><html><head><title>CoverImage browser checks</title></head><body><h1>CoverImage browser checks</h1><button id="run-check">Run loading-error check</button><p id="result" role="status">Ready</p><div id="cover-root" style="width:160px"></div><script type="module" src="/tests/cover-image.browser.tsx"></script></body></html>'
          )
        })
      }
    }
  ]
})
await server.listen()
console.log('CoverImage checks: http://127.0.0.1:3011/__cover-image-check')
