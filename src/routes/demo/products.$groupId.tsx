import { createFileRoute, useParams } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/demo/products/$groupId')({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  const { groupId } = useParams({ from: '/demo/products/$groupId' })

  const fileUrl = useQuery(api.products.getProductUrl, {
    groupId: Number(groupId),
  })
  const [products, setProducts] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (!fileUrl) return

    fetch(fileUrl)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Failed to fetch file:', err))
  }, [fileUrl])

  if (!fileUrl) return <div>Loading URL...</div>
  if (!products) return <div>Loading file...</div>

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Top Products</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {products
          .filter(
            (product: any) =>
              product?.prices?.marketPrice &&
              product.extendedData?.find((item: any) => item.name === 'Number'),
          )
          .sort((a: any, b: any) => b.prices.marketPrice - a.prices.marketPrice)
          .slice(0, 3)
          .map((product: any, index: number) => (
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
                    {product.extendedData?.find(
                      (item: any) => item.name === 'Number',
                    )?.value ?? 'N/A'}
                  </span>
                </div>
                <h3 className="text-xl font-bold leading-tight">
                  {product.name}
                </h3>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Market Price</p>
                  <p className="text-3xl font-bold text-primary">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(product.prices.marketPrice)}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Products</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Card Number</TableHead>
            <TableHead>Url</TableHead>
            <TableHead className="text-right">Market Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product: any, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {product.extendedData?.find(
                  (item: any) => item.name === 'Number',
                )?.value ?? ''}
              </TableCell>
              <TableCell>
                <a
                  href={product.url}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  TCGPlayer
                </a>
              </TableCell>
              <TableCell className="text-right">
                {product?.prices?.marketPrice
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(product.prices.marketPrice)
                  : ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
