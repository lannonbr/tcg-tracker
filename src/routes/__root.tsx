import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import Header from '../components/Header'

import ConvexProvider from '../integrations/convex/provider'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TCG Track',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const serverEnv = {
    CONVEX_URL: (process.env.CONVEX_URL || process.env.CONVEX_CLOUD_URL) ?? '',
    CONVEX_SITE_URL: process.env.CONVEX_SITE_URL ?? '',
  }
  // During hydration, the server-rendered bootstrap script has already run.
  // Reuse its values instead of recomputing from browser-side process.env,
  // which is intentionally empty in the client bundle.
  const env =
    typeof window === 'undefined'
      ? serverEnv
      : ((window as typeof window & { __ENV__?: typeof serverEnv }).__ENV__ ??
        serverEnv)
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify(env)}`,
          }}
        />
      </head>
      <body>
        <ConvexProvider>
          <Header />
          {children}
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
