import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const model = vi.hoisted(() => ({
  init: vi.fn(),
  downloadModel: vi.fn(),
  translate: vi.fn(),
  close: vi.fn()
}))
const createModel = vi.hoisted(() => vi.fn())
vi.mock('mtranserver', () => ({
  MTran: class {
    constructor() {
      createModel()
      Object.assign(this, model)
    }
  }
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

it('skips local model preparation when Azure is configured', async () => {
  vi.stubEnv('AZURE_TRANSLATOR_KEY', 'test-key')
  await import('./prepare-translation.mjs')
  expect(createModel).not.toHaveBeenCalled()
  expect(model.init).not.toHaveBeenCalled()
})

it('prepares and closes the fallback model without Azure', async () => {
  vi.stubEnv('AZURE_TRANSLATOR_KEY', '')
  await import('./prepare-translation.mjs')
  expect(createModel).toHaveBeenCalledOnce()
  expect(model.init).toHaveBeenCalledOnce()
  expect(model.downloadModel).toHaveBeenCalledWith('en', 'zh')
  expect(model.translate).toHaveBeenCalledWith('en', 'zh', 'The translation model is ready.')
  expect(model.close).toHaveBeenCalledOnce()
})
