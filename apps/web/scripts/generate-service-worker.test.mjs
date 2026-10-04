import { expect, it } from 'vitest'
import {
  cachePublicHtml,
  matchesPublicPage,
  matchesStaticAsset
} from './generate-service-worker.mjs'

function page(path, options = {}) {
  return {
    sameOrigin: true,
    url: new URL(path, 'https://news.example'),
    request: {
      method: options.method ?? 'GET',
      mode: options.mode ?? 'navigate',
      headers: new Headers(options.headers)
    }
  }
}

it('caches public document navigations, excluding private routes, writes and RSC', () => {
  for (const path of ['/', '/ai', '/news/xinhua/article', '/ai/events/event']) {
    expect(matchesPublicPage(page(path))).toBe(true)
  }
  for (const path of [
    '/admin',
    '/api/search',
    '/following',
    '/reading-list',
    '/out',
    '/feeds/ai.xml'
  ]) {
    expect(matchesPublicPage(page(path))).toBe(false)
  }
  expect(matchesPublicPage(page('/ai?_rsc=test'))).toBe(false)
  expect(matchesPublicPage(page('/ai', { headers: { RSC: '1' } }))).toBe(false)
  expect(matchesPublicPage(page('/ai', { mode: 'cors' }))).toBe(false)
  expect(matchesPublicPage(page('/ai', { method: 'POST' }))).toBe(false)
  expect(matchesPublicPage({ ...page('/ai'), sameOrigin: false })).toBe(false)
})

it('only stores successful public HTML, never RSC, errors or no-store responses', async () => {
  const html = new Response('article', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  expect(await cachePublicHtml({ response: html })).toBe(html)
  for (const response of [
    new Response('rsc', { headers: { 'Content-Type': 'text/x-component' } }),
    new Response('error', { status: 500, headers: { 'Content-Type': 'text/html' } }),
    new Response('private', {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'private, max-age=0' }
    }),
    new Response('private', {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
    })
  ]) {
    expect(await cachePublicHtml({ response })).toBeNull()
  }
})

it('only caches same-origin Next static scripts, styles and fonts', () => {
  const asset = {
    sameOrigin: true,
    url: new URL('https://news.example/_next/static/chunks/hash.js'),
    request: { method: 'GET', destination: 'script' }
  }
  expect(matchesStaticAsset(asset)).toBe(true)
  expect(matchesStaticAsset({ ...asset, sameOrigin: false })).toBe(false)
  expect(matchesStaticAsset({ ...asset, url: new URL('https://news.example/api/admin') })).toBe(
    false
  )
  expect(matchesStaticAsset({ ...asset, request: { method: 'POST', destination: 'script' } })).toBe(
    false
  )
})
