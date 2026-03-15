import type { ReactElement } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

export function ProductHoverPreview({
  children,
  imageUrl,
  name,
  cardNumber,
}: {
  children: ReactElement
  imageUrl: string | null
  name: string
  cardNumber?: string
}) {
  return (
    <HoverCard openDelay={100} closeDelay={50}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 p-3">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-md border bg-muted/30">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="aspect-3/4 w-full object-contain"
              />
            ) : (
              <div className="flex aspect-3/4 items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-tight">{name}</p>
            {cardNumber ? (
              <p className="text-xs text-muted-foreground">
                Card #{cardNumber}
              </p>
            ) : null}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
