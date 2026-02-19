import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export const Route = createFileRoute('/sets/$categoryId')({
  ssr: false,
  component: ConvexSets,
})

function ConvexSets() {
  let { categoryId } = useParams({ from: '/sets/$categoryId' })

  const set = useQuery(api.sets.getSets, {
    categoryId: Number(categoryId),
  })!

  const fileUrl = useQuery(api.sets.getSetsUrl, {
    categoryId: Number(categoryId),
  })
  const [setListing, setSetListing] = useState<Record<string, any> | null>(null)

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

      <h2 className="text-2xl font-bold mb-4">Sets for {set[0].name}</h2>
      <ul className="">
        {setListing.results.map(
          (set: { name: string; publishedOn: string; groupId: number }) => {
            return (
              <li className="list-disc ml-8 my-2">
                <Link
                  to="/products/$groupId"
                  params={{ groupId: set.groupId.toString() }}
                  className="hover:underline"
                >
                  {set.name}
                </Link>
                (Released: {dayjs(set.publishedOn).format('MMM DD, YYYY')})
              </li>
            )
          },
        )}
      </ul>
    </div>
  )
}
