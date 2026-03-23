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
  const env = {
    CONVEX_URL: process.env.CONVEX_URL ?? '',
    CONVEX_SITE_URL: process.env.CONVEX_SITE_URL ?? '',
  }
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
