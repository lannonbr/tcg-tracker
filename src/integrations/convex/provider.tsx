import { ConvexProvider } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'

let convexQueryClient: ConvexQueryClient | null = null

function getConvexQueryClient() {
  if (!convexQueryClient) {
    const CONVEX_URL =
      (window as any).__ENV__?.CONVEX_URL || (import.meta as any).env.VITE_CONVEX_URL
    if (!CONVEX_URL) {
      console.error('missing envar CONVEX_URL')
    }
    convexQueryClient = new ConvexQueryClient(CONVEX_URL)
  }
  return convexQueryClient
}

export default function AppConvexProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const client = getConvexQueryClient()
  return (
    <ConvexProvider client={client.convexClient}>
      {children}
    </ConvexProvider>
  )
}
