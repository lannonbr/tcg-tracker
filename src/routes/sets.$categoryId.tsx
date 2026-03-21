import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useAction } from 'convex/react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { RefreshButton } from '@/components/RefreshButton'

export const Route = createFileRoute('/sets/$categoryId')({
  ssr: false,
  component: ConvexSets,
})

function ConvexSets() {
  const { categoryId } = useParams({ from: '/sets/$categoryId' })

  const action = useAction(api.sets.fetchSetUrl)

  const [set, setSet] = useState<Array<any> | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [setListing, setSetListing] = useState<Record<string, any> | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const loadSets = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true)
    }
    setRefreshError(null)

    try {
      const result = await action({
        categoryId: parseInt(categoryId),
        forceRefresh,
      })
      setSet(result.set)
      setFileUrl(result.fileUrl)
      setSetListing(null)
      document.title = `${result.set[0].name} | TCG Track`
    } catch (error) {
      setRefreshError(
        error instanceof Error ? error.message : 'Failed to refresh sets.',
      )
    } finally {
      if (forceRefresh) {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    void loadSets()
  }, [categoryId])

  useEffect(() => {
    if (!fileUrl) return

    fetch(fileUrl)
      .then((res) => res.json())
      .then((data) => setSetListing(data))
      .catch((err) => console.error('Failed to fetch file:', err))
  }, [fileUrl])

  if (!set) return <div>Loading...</div>
  if (!fileUrl) return <div>Loading URL...</div>
  if (!setListing) return <div>Loading file...</div>

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
            <Link
              to="/sets"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Card games
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Game: {set[0].name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Sets for {set[0].name}</h2>
        <RefreshButton
          onClick={() => void loadSets(true)}
          isRefreshing={isRefreshing}
        />
      </div>
      {refreshError ? (
        <p className="mb-4 text-sm text-destructive">{refreshError}</p>
      ) : null}
      <ul className="">
        {setListing.results.map(
          (setObj: { name: string; publishedOn: string; groupId: number }) => {
            const publishedOn = dayjs(setObj.publishedOn)
            const isUpcoming = publishedOn.isAfter(dayjs(), 'day')
            return (
              <li key={setObj.groupId} className="list-disc ml-8 my-2">
                <Link
                  to="/products/$groupId"
                  params={{ groupId: setObj.groupId.toString() }}
                  search={{ categoryId: parseInt(categoryId) }}
                  className="hover:underline"
                >
                  {setObj.name}
                </Link>
                <span className={`ml-1 ${isUpcoming ? 'text-red-600' : ''}`}>
                  ({isUpcoming ? 'To Be Released' : 'Released'}:{' '}
                  {publishedOn.format('MMM DD, YYYY')})
                </span>
              </li>
            )
          },
        )}
      </ul>
    </div>
  )
}
