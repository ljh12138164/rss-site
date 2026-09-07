'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

let browserClient: QueryClient | undefined

export function QueryProvider({ children }: { children: ReactNode }) {
  const createClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 30 * 60 * 1000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
          retry: 1
        }
      }
    })
  let client: QueryClient
  if (typeof window === 'undefined') client = createClient()
  else {
    if (!browserClient) browserClient = createClient()
    client = browserClient
  }
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
