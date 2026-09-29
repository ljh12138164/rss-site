import { describe, expect, it } from 'vitest'
import { metadata } from './layout'

describe('root layout metadata', () => {
  it('includes site verification tags for search engines', () => {
    expect(metadata.verification?.other).toMatchObject({
      'msvalidate.01': '1D97E9469470F8C3242E298438BF37AD',
      'baidu-site-verification': 'codeva-DbvPspLmOE'
    })
  })
})
