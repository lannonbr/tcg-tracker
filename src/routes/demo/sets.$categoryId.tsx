import { createFileRoute, useParams } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

export const Route = createFileRoute('/demo/sets/$categoryId')({
  ssr: false,
  component: ConvexSets,
})

function ConvexSets() {
  let { categoryId } = useParams({ from: '/demo/sets/$categoryId' })

  const fileUrl = useQuery(api.sets.getSetUrl, { groupId: Number(categoryId) })
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
    <div>
      <h2 className="text-xl m-4">Sets for Group {categoryId}</h2>
      <ul>
        {setListing.results.map(
          (set: { name: string; publishedOn: string }) => {
            console.log(set)
            return (
              <li className="list-disc ml-8">
                {set.name} (Released:{' '}
                {dayjs(set.publishedOn).format('MMM DD, YYYY')})
              </li>
            )
          },
        )}
      </ul>
    </div>
  )
}
