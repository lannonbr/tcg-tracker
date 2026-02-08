import { createFileRoute, Link } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'

export const Route = createFileRoute('/demo/sets/')({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  const categories = useQuery(api.categories.getCategories)

  if (!categories) return

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Categories</h1>
      <ul className="grid grid-cols-4 gap-2">
        {categories.map((category) => (
          <li key={category.categoryId}>
            <Link
              className="hover:underline"
              to="/demo/sets/$categoryId"
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
