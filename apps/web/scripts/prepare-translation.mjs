import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.env.AZURE_TRANSLATOR_KEY?.trim()) {
  console.info('Azure translation configured; local fallback model will load on demand.')
} else {
  const { MTran } = await import('mtranserver')
  const webRoot = fileURLToPath(new URL('../', import.meta.url))
  const engine = new MTran({
    configDir: process.env.MT_CONFIG_DIR ?? path.join(webRoot, '.mtran/config'),
    modelDir: process.env.MT_MODEL_DIR ?? path.join(webRoot, '.mtran/models'),
    checkUpdate: false,
    logToFile: false
  })
  try {
    console.info('Loading translation model metadata…')
    await engine.init()
    console.info('Downloading/verifying English to Chinese model files…')
    await engine.downloadModel('en', 'zh')
    console.info('Running a local translation check…')
    await engine.translate('en', 'zh', 'The translation model is ready.')
    console.info('English to Chinese model downloaded and verified.')
  } finally {
    await engine.close()
  }
}
