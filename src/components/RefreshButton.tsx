import { RefreshCw } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type RefreshButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isRefreshing?: boolean
}

export function RefreshButton({
  children = 'Refresh data',
  className = '',
  disabled,
  isRefreshing = false,
  ...props
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isRefreshing}
      className={`inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      {...props}
    >
      <RefreshCw
        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <span>{isRefreshing ? 'Refreshing...' : children}</span>
    </button>
  )
}
