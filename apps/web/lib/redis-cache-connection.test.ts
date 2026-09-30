import { createServer, type Socket } from 'node:net'
import { afterEach, expect, it, vi } from 'vitest'
import { readResultCache, writeResultCache } from './redis-cache'

afterEach(() => vi.unstubAllEnvs())

it('drops stalled Redis connections instead of retaining timed-out commands', async () => {
  const sockets = new Set<Socket>()
  const server = createServer((socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.on('data', (data) => {
      // Acknowledge client metadata only; deliberately never answer GET/SET.
      const metadataCommands = data.toString().match(/\bsetinfo\b/gi) ?? []
      for (const _command of metadataCommands) socket.write('+OK\r\n')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing server address')
  vi.stubEnv('REDIS_URL', `redis://127.0.0.1:${address.port}`)
  try {
    expect(
      await readResultCache('translation:stalled', (_value): _value is string => true)
    ).toBeNull()
    await vi.waitFor(() => expect(sockets.size).toBe(0))
    await writeResultCache('translation:stalled', { title: '译文' })
    await vi.waitFor(() => expect(sockets.size).toBe(0))
  } finally {
    for (const socket of sockets) socket.destroy()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
