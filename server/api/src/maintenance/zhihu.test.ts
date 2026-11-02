import { describe, expect, it, vi } from 'vitest'
import { refreshZhihuCookie, requestJson, zhihuAccount } from './zhihu.js'
import { encryptZseV4 } from './zse-v4.js'

describe('Zhihu web authentication protocol', () => {
  it('rejects redirects without following them or forwarding credentials', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { Location: 'https://other.example/' }
      })
    )
    await expect(
      requestJson(request, 'https://www.zhihu.com/api/v4/me', {
        headers: { Cookie: 'z_c0=synthetic' }
      })
    ).rejects.toThrow('upstream_http_302')
    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0][1]?.redirect).toBe('manual')
  })

  it.each(['value-only', 'z_c0=', 'z_c0=synthetic\r\ninvalid=value', 'z_c0=\u4e2d\u6587'])(
    'rejects malformed Cookie before any identity request: %s',
    async (cookie) => {
      const request = vi.fn<typeof fetch>()
      await expect(zhihuAccount(cookie, request)).rejects.toThrow('invalid_cookie')
      expect(request).not.toHaveBeenCalled()
    }
  )

  // Generated independently by the reference Python implementation at 2b746001.
  it.each([
    ['', '+6xIt2FGPUaT5v8jKc7bCB=/'],
    ['abc', '+6epaYd+9lKdla1kzAP77ky9'],
    [
      'refresh_token=synthetic&timestamp=1700000000000',
      '+66PXRWs3F3qePFk07uA7Rb=CS483R8paXew2y0p7zz78inv7KJfMrSckVo3BfSpxNxW6e8Sb=byyT5+NMrbMoRI'
    ],
    [
      'a=hello/world&b=hello+world&c=中文',
      '+VbD7yUACXslmj/K4AhF8wLBpPTxLUsh0pi2RsBvWrW4WC81l+IpoxQ9a8j0PIZWjPMXe/D1oRFoY3Lfwflg080hgvrUHe5yVC1w7jHvzYWO'
    ]
  ])('matches the reference encryption for %s', (input, expected) => {
    expect(encryptZseV4(input)).toBe(expected)
  })

  it('performs both POST requests and uses the response Cookie, not the JSON access token', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ refresh_token: 'synthetic-refresh' }))
      .mockResolvedValueOnce(
        Response.json(
          { access_token: 'not-a-cookie' },
          { headers: { 'Set-Cookie': 'z_c0=new-cookie; Path=/; HttpOnly' } }
        )
      )
    const result = await refreshZhihuCookie(
      'z_c0=old; d_c0=device; _xsrf=xsrf',
      request,
      1700000000000
    )
    expect(result).toBe('z_c0=new-cookie; d_c0=device; _xsrf=xsrf')
    expect(request.mock.calls.map(([url, init]) => [url, init?.method, init?.redirect])).toEqual([
      ['https://www.zhihu.com/api/account/prod/token/refresh', 'POST', 'manual'],
      ['https://www.zhihu.com/api/v3/oauth/sign_in', 'POST', 'manual']
    ])
    const init = request.mock.calls[1][1]
    expect(new Headers(init?.headers).get('x-zse-83')).toBe('3_3.0')
    expect(init?.body).not.toContain('synthetic-refresh')
    expect(init?.body).not.toContain('grant_type=')
  })

  it.each(['', 'deleted', 'null', '""'])(
    'rejects missing or deleted login Cookie %s',
    async (value) => {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ refresh_token: 'synthetic-refresh' }))
        .mockResolvedValueOnce(
          new Response('{}', { headers: { 'Set-Cookie': `z_c0=${value}; Path=/` } })
        )
      await expect(refreshZhihuCookie('z_c0=old', request)).rejects.toThrow('missing_new_cookie')
    }
  )

  it('does not interpret HTTP 200 without a refresh token as success', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ error: 'login required' }))
    await expect(refreshZhihuCookie('z_c0=old', request)).rejects.toThrow('missing_refresh_token')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('requires a real account identity from the authenticated API', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ name: 'guest' }))
    await expect(zhihuAccount('z_c0=old', request)).rejects.toThrow('invalid_identity')
  })

  it.each(['Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT'])(
    'rejects a nonempty Cookie that the server deletes through %s',
    async (expiry) => {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ refresh_token: 'synthetic' }))
        .mockResolvedValueOnce(
          new Response('{}', { headers: { 'Set-Cookie': `z_c0=nonempty; ${expiry}` } })
        )
      await expect(refreshZhihuCookie('z_c0=old', request)).rejects.toThrow('missing_new_cookie')
    }
  )
})
