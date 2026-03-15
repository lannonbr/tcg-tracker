import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Doc } from 'convex/_generated/dataModel'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, SortHeaderButton } from '@/components/data-table'
import { ProductHoverPreview } from '@/components/ProductHoverPreview'

export const Route = createFileRoute('/')({ component: App, ssr: false })

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

type TrackedCardRow = Doc<'trackedProducts'> & {
  marketPrice: number | null
  imageUrl: string | null
}

const columns: Array<ColumnDef<TrackedCardRow>> = [
  {
    accessorKey: 'productName',
    header: ({ column }) => (
      <SortHeaderButton
        label="Name"
        sort={column.getIsSorted()}
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <ProductHoverPreview
        imageUrl={row.original.imageUrl}
        name={row.getValue<string>('productName')}
      >
        <span className="font-medium">
          {row.getValue<string>('productName')}
        </span>
      </ProductHoverPreview>
    ),
  },
  {
    accessorKey: 'groupName',
    header: ({ column }) => (
      <SortHeaderButton
        label="Set"
        sort={column.getIsSorted()}
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <Link
        to="/products/$groupId"
        params={{ groupId: String(row.original.groupId) }}
        search={{ categoryId: row.original.categoryId }}
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        {row.getValue<string>('groupName')}
      </Link>
    ),
  },
  {
    accessorKey: 'marketPrice',
    header: ({ column }) => (
      <SortHeaderButton
        label="Market Price"
        sort={column.getIsSorted()}
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const a =
        rowA.getValue<number | null>(columnId) ?? Number.NEGATIVE_INFINITY
      const b =
        rowB.getValue<number | null>(columnId) ?? Number.NEGATIVE_INFINITY
      return a - b
    },
    cell: ({ row }) => {
      const price = row.getValue<number | null>('marketPrice')
      return price !== null ? currencyFormatter.format(price) : '—'
    },
  },
  {
    accessorKey: 'requestedPrice',
    header: ({ column }) => (
      <SortHeaderButton
        label="Requested Price"
        sort={column.getIsSorted()}
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    enableSorting: true,
    cell: ({ row }) =>
      currencyFormatter.format(row.getValue<number>('requestedPrice')),
  },
]

function TrackedCardsTable() {
  const trackedProducts = useQuery(api.trackedProducts.getTrackedProducts)
  const fetchProducts = useAction(api.products.fetchProducts)
  const [productDetails, setProductDetails] = useState<
    Map<number, { marketPrice: number | null; imageUrl: string | null }>
  >(new Map())

  useEffect(() => {
    if (!trackedProducts?.length) return

    const groups = new Map<number, number>()
    for (const p of trackedProducts) {
      if (!groups.has(p.groupId)) groups.set(p.groupId, p.categoryId)
    }

    const loadPrices = async () => {
      const detailMap = new Map<
        number,
        { marketPrice: number | null; imageUrl: string | null }
      >()
      for (const [groupId, categoryId] of groups) {
        const { data } = await fetchProducts({ categoryId, groupId })
        if (!data) continue
        const products: Array<{
          productId: number
          imageUrl: string
          prices?: { marketPrice: number }
        }> = data
        for (const product of products) {
          detailMap.set(product.productId, {
            marketPrice: product.prices?.marketPrice ?? null,
            imageUrl: product.imageUrl,
          })
        }
      }
      setProductDetails(detailMap)
    }

    loadPrices()
  }, [fetchProducts, trackedProducts])

  if (!trackedProducts)
    return <p className="text-muted-foreground">Loading...</p>
  if (!trackedProducts.length)
    return (
      <p className="text-muted-foreground">
        No cards tracked yet.{' '}
        <Link
          to="/sets"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Browse All Games
        </Link>{' '}
        to start tracking.
      </p>
    )

  const tableData: Array<TrackedCardRow> = trackedProducts.map((p) => ({
    ...p,
    marketPrice: productDetails.get(p.productId)?.marketPrice ?? null,
    imageUrl: productDetails.get(p.productId)?.imageUrl ?? null,
  }))

  return <DataTable columns={columns} data={tableData} />
}

function App() {
  useEffect(() => {
    document.title = 'Home | TCG Track'
  }, [])

  return (
    <div className="min-h-screen bg-linear-to-b from-violet-100 via-purple-50 to-white flex flex-col">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-violet-200/40 via-purple-100/40 to-fuchsia-100/40"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <h1 className="text-6xl md:text-7xl font-black text-black">
              TCG Tracker
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-black mb-4 font-light">
            Browse and follow trading card games
          </p>
          <p className="text-lg text-black max-w-3xl mx-auto mb-8">
            Powered via{' '}
            <a
              className="text-violet-600 hover:underline"
              href="https://tcgcsv.com"
            >
              TCGCSV
            </a>
            .
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/sets"
              className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-violet-400/50"
            >
              Browse All Games
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-12 flex-1">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Tracked Cards</h2>
          <TrackedCardsTable />
        </div>
      </section>
    </div>
  )
}
