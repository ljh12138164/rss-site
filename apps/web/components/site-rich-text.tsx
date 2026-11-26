'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function AboutRssAnswer() {
  const t = useTranslations('about')
  return t.rich('faqRssA', {
    mcp: (chunks) => (
      <Link className="text-primary underline underline-offset-4" href="/mcp">
        {chunks}
      </Link>
    )
  })
}

export function AboutPrivacyNotice() {
  const t = useTranslations('about')
  return t.rich('privacyBody', {
    privacy: (chunks) => (
      <Link className="text-primary underline underline-offset-4" href="/privacy">
        {chunks}
      </Link>
    ),
    terms: (chunks) => (
      <Link className="text-primary underline underline-offset-4" href="/privacy#terms">
        {chunks}
      </Link>
    )
  })
}

export function AboutContactNotice() {
  const t = useTranslations('about')
  return t.rich('contactBody', {
    author: (chunks) => (
      <a
        className="text-primary underline underline-offset-4"
        href="https://blog.ljhboard.cn/"
        rel="author"
      >
        {chunks}
      </a>
    ),
    issues: (chunks) => (
      <a
        className="text-primary underline underline-offset-4"
        href="https://github.com/ljh12138164/rss-site/issues"
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks}
      </a>
    )
  })
}

export function McpPlatformDescription() {
  const t = useTranslations('mcp')
  const code = (chunks: React.ReactNode) => <code className="text-foreground">{chunks}</code>
  return t.rich('platformDesc', {
    c1: code,
    c2: code,
    c3: code,
    c4: code,
    c5: code
  })
}
