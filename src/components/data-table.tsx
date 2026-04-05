import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

declare module '@tanstack/react-table' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, filterValue: string) => {
  const value = String(row.getValue(columnId)).toLowerCase()
  const filter = filterValue.toLowerCase()
  let filterIdx = 0
  for (let i = 0; i < value.length && filterIdx < filter.length; i++) {
    if (value[i] === filter[filterIdx]) filterIdx++
  }
  return filterIdx === filter.length
}

type DataTableProps<TData, TValue> = {
  columns: Array<ColumnDef<TData, TValue>>
  data: Array<TData>
  filterColumnId?: string
}

function SortHeaderButton({
  label,
  onClick,
  sort,
}: {
  label: string
  onClick: () => void
  sort: false | 'asc' | 'desc'
}) {
  const Icon =
    sort === 'asc' ? ArrowUp : sort === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 font-medium text-left"
    >
      {label}
      <Icon className="h-4 w-4" />
    </button>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumnId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const filterValue = filterColumnId
    ? (table.getColumn(filterColumnId)?.getFilterValue() as string)
    : ''

  return (
    <div>
      {filterColumnId ? (
        <div className="mb-4">
          <input
            placeholder="Search products by name..."
            aria-label="Search products by name..."
            value={filterValue}
            onChange={(e) =>
              table.getColumn(filterColumnId)?.setFilterValue(e.target.value)
            }
            className="max-w-sm w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      ) : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === 'marketPrice' ? 'text-right' : '',
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export { SortHeaderButton }
