import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useAction, useQuery } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { RefreshButton } from '@/components/RefreshButton'

export const Route = createFileRoute('/sets/')({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  const fetchCategories = useAction(api.categories.fetchCategories)
  const categories = useQuery(api.categories.getCategories)
  const didStartSyncRef = useRef(false)
  const categoriesRef = useRef(categories)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  categoriesRef.current = categories

  useEffect(() => {
    document.title = 'Card Games | TCG Track'
  }, [])

  const runCategorySync = async () => {
    setIsSyncing(true)
    setSyncError(null)

    try {
      await fetchCategories({})
    } catch (error) {
      if ((categoriesRef.current?.length ?? 0) > 0) {
        console.error('Failed to sync categories:', error)
      } else {
        setSyncError(
          error instanceof Error ? error.message : 'Failed to sync categories.',
        )
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const refreshCategories = async () => {
    setIsSyncing(true)
    setSyncError(null)

    try {
      await fetchCategories({ forceRefresh: true })
    } catch (error) {
      if ((categoriesRef.current?.length ?? 0) > 0) {
        console.error('Failed to sync categories:', error)
      } else {
        setSyncError(
          error instanceof Error ? error.message : 'Failed to sync categories.',
        )
      }
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (didStartSyncRef.current) return
    didStartSyncRef.current = true
    void runCategorySync()
  }, [])

  let content = <p>Loading categories...</p>

  if (categories?.length === 0 && isSyncing) {
    content = <p>Syncing categories...</p>
  } else if (categories?.length === 0 && syncError) {
    content = (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          Failed to sync categories. {syncError}
        </p>
        <button
          type="button"
          onClick={() => void runCategorySync()}
          className="rounded-md border border-primary px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Retry
        </button>
      </div>
    )
  } else if (categories && categories.length > 0) {
    content = (
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
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
    )
  }

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

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <RefreshButton
          onClick={() => void refreshCategories()}
          isRefreshing={isSyncing}
        />
      </div>
      {content}
    </div>
  )
}
