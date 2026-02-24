import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { useEffect } from 'react'

export const Route = createFileRoute('/sets/')({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  const categories = useQuery(api.categories.getCategories)

  useEffect(() => {
    document.title = 'Card Games | TCG Track'
  }, [])

  if (!categories) return

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Card games</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {categories.map((category) => (
          <li key={category.categoryId}>
            <Link
              className="hover:underline"
              to="/sets/$categoryId"
              params={{ categoryId: category.categoryId.toString() }}
            >
              {category.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
