import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '稍后读',
  robots: { index: false, follow: false }
}

export default function ReadingListLayout({ children }: { children: ReactNode }) {
  return children
}
