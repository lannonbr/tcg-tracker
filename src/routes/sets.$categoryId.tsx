import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/sets/$categoryId')({
  ssr: false,
  component: ConvexSets,
})

function ConvexSets() {
  let { categoryId } = useParams({ from: '/sets/$categoryId' })

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

  if (!fileUrl) return <div>Loading URL...</div>
  if (!setListing) return <div>Loading file...</div>

  return (
    <div className="container mx-auto p-6">
      <p className="inline-flex rounded-xl bg-violet-400 hover:bg-violet-500 p-2 mb-4">
        <ArrowLeft />
        <Link to="/sets">Back to Card games listing</Link>
      </p>

      <h2 className="text-2xl font-bold mb-4">Sets for Group {categoryId}</h2>
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
