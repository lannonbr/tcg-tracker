import {
  Link,
  createFileRoute,
  useParams,
  useSearch,
} from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useAction, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import type { Doc } from 'convex/_generated/dataModel'
import type { ColumnDef } from '@tanstack/react-table'
import type { ProductData } from 'convex/products'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { DataTable, SortHeaderButton } from '@/components/data-table'
import { TrackSidebar } from '@/components/TrackedSidebar'

type ProductRow = {
  productId: number
  name: string
  cardNumber: string
  imageUrl: string
  url: string
  marketPrice: number | null
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function createColumns(
  onTrack: (product: ProductRow) => void,
  trackedMap: Map<number, Doc<'trackedProducts'>>,
): Array<ColumnDef<ProductRow>> {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortHeaderButton
          label="Name"
          sort={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue<string>('name')}</span>
      ),
    },
    {
      accessorKey: 'cardNumber',
      header: ({ column }) => (
        <SortHeaderButton
          label="Card Number"
          sort={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'url',
      header: 'Url',
      enableSorting: false,
      cell: ({ row }) => (
        <a
          href={row.getValue<string>('url')}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          TCGPlayer
        </a>
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
        const marketPrice = row.getValue<number | null>('marketPrice')
        return marketPrice !== null ? currencyFormatter.format(marketPrice) : ''
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const isTracked = trackedMap.has(row.original.productId)
        return (
          <div className="text-right">
            <button
              type="button"
              onClick={() => onTrack(row.original)}
              className="rounded-md border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {isTracked ? 'Edit' : 'Track'}
            </button>
          </div>
        )
      },
    },
  ]
}

export const Route = createFileRoute('/products/$groupId')({
  validateSearch: (search) => {
    if (!search.categoryId) throw new Error('categoryId is required')
    return { categoryId: Number(search.categoryId) }
  },
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  const { groupId } = useParams({ from: '/products/$groupId' })
  const { categoryId } = useSearch({ from: '/products/$groupId' })

  const fetchSetUrl = useAction(api.sets.fetchSetUrl)
  const fetchProductUrl = useAction(api.products.fetchProductUrl)
  const trackedProducts = useQuery(
    api.trackedProducts.getTrackedProductsByGroup,
    { groupId: Number(groupId) },
  )

  const [setData, setSetData] = useState<Array<any> | null>(null)
  const [productMeta, setProductMeta] = useState<Array<any> | null>(null)
  const [products, setProducts] = useState<Array<ProductData>>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null,
  )

  useEffect(() => {
    fetchSetUrl({ categoryId }).then(({ set }) => {
      setSetData(set)
    })
  }, [categoryId])

  useEffect(() => {
    fetchProductUrl({ categoryId, groupId: Number(groupId) }).then(
      ({ product, fileUrl }) => {
        setProductMeta(product)
        document.title = `${product[0].name} | TCG Track`
        if (!fileUrl) return
        fetch(fileUrl)
          .then((res) => res.json())
          .then((data) => setProducts(data))
          .catch((err) => console.error('Failed to fetch file:', err))
      },
    )
  }, [groupId, categoryId])

  if (!productMeta || !setData) return <div>Loading...</div>
  if (!products.length) return <div>Loading file...</div>

  const tableData: Array<ProductRow> = products.map((currentProduct) => ({
    productId: currentProduct.productId,
    name: currentProduct.name,
    cardNumber:
      currentProduct.extendedData.find((item) => item.name === 'Number')
        ?.value ?? '',
    imageUrl: currentProduct.imageUrl,
    url: currentProduct.url,
    marketPrice: currentProduct.prices?.marketPrice ?? null,
  }))

  const trackedMap = new Map(
    (trackedProducts ?? []).map((t) => [t.productId, t]),
  )

  const columns = createColumns(
    (product) => setSelectedProduct(product),
    trackedMap,
  )

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
            <Link
              to="/sets/$categoryId"
              params={{ categoryId: categoryId.toString() }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Game: {setData[0].name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Set: {productMeta[0].name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h2 className="text-2xl font-bold mb-4">
        Top Products for {productMeta[0].name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {products
          .filter(
            (productItem: ProductData) =>
              productItem.prices?.marketPrice &&
              productItem.extendedData.find((item) => item.name === 'Number'),
          )
          .sort(
            (a: ProductData, b: ProductData) =>
              (b.prices?.marketPrice ?? 0) - (a.prices?.marketPrice ?? 0),
          )
          .slice(0, 3)
          .map((productItem: ProductData, index: number) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-lg transition-all hover:shadow-xl"
            >
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1} Top Card
                  </span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {productItem.extendedData.find(
                      (item) => item.name === 'Number',
                    )?.value ?? 'N/A'}
                  </span>
                </div>
                <h3 className="text-xl font-bold leading-tight">
                  {productItem.name}
                </h3>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Market Price</p>
                  {/** Filter guarantees a numeric price for top cards. */}
                  <p className="text-3xl font-bold text-primary">
                    {currencyFormatter.format(
                      productItem.prices?.marketPrice ?? 0,
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Products</h2>

      <DataTable columns={columns} data={tableData} />

      <TrackSidebar
        product={selectedProduct}
        existingRecord={
          selectedProduct
            ? (trackedMap.get(selectedProduct.productId) ?? null)
            : null
        }
        categoryId={categoryId}
        groupId={Number(groupId)}
        groupName={productMeta[0].name}
        categoryName={setData[0].name}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
