import { cn } from '@/lib/utils'
import { api } from 'convex/_generated/api'
import { Doc } from 'convex/_generated/dataModel'
import { useMutation } from 'convex/react'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

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

export function TrackSidebar({
  product,
  existingRecord,
  categoryId,
  groupId,
  groupName,
  categoryName,
  onClose,
}: {
  product: ProductRow | null
  existingRecord: Doc<'trackedProducts'> | null
  categoryId: number
  groupId: number
  groupName: string
  categoryName: string
  onClose: () => void
}) {
  const [targetPrice, setTargetPrice] = useState('')
  const trackProduct = useMutation(api.trackedProducts.trackProduct)
  const updateTrackedProduct = useMutation(
    api.trackedProducts.updateTrackedProduct,
  )
  const untrackProduct = useMutation(api.trackedProducts.untrackProduct)

  useEffect(() => {
    setTargetPrice(existingRecord ? String(existingRecord.requestedPrice) : '')
  }, [product, existingRecord])

  async function handleSubmit() {
    if (!product || !targetPrice) return
    if (existingRecord) {
      await updateTrackedProduct({
        id: existingRecord._id,
        requestedPrice: Number(targetPrice),
      })
    } else {
      await trackProduct({
        categoryId,
        groupId,
        productId: product.productId,
        productName: product.name,
        groupName,
        categoryName,
        requestedPrice: Number(targetPrice),
      })
    }
    onClose()
  }

  async function handleUntrack() {
    if (!existingRecord) return
    await untrackProduct({ id: existingRecord._id })
    onClose()
  }

  return (
    <>
      {product && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col',
          product ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {existingRecord ? 'Edit Tracked Card' : 'Track'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {product && (
          <div className="flex flex-col gap-4 p-4 overflow-y-auto">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full rounded-lg object-contain"
            />
            <div>
              <p className="text-xs text-muted-foreground">Market Price</p>
              <p className="text-2xl font-bold text-primary">
                {product.marketPrice !== null
                  ? currencyFormatter.format(product.marketPrice)
                  : '—'}
              </p>
            </div>
            <h3 className="text-xl font-bold">{product.name}</h3>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="target-price" className="text-sm font-medium">
                Target Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  id="target-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-md border bg-background pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!targetPrice}
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            {existingRecord && (
              <button
                type="button"
                onClick={handleUntrack}
                className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              >
                Untrack
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
