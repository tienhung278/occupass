import { flexRender, type Table as TableInstance } from '@tanstack/react-table'
import { LoadingOverlay } from './loading-overlay'

interface DataTableProps<TData> {
  table: TableInstance<TData>
  emptyLabel: string
  isLoading: boolean
}

export function DataTable<TData>({ table, emptyLabel, isLoading }: DataTableProps<TData>) {
  const columnCount = table.getVisibleLeafColumns().length
  const rows = table.getRowModel().rows
  const statusLabel = isLoading ? 'Loading rows...' : emptyLabel

  return (
    <div className="table-overlay-container">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="table-status">
                  {statusLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isLoading ? <LoadingOverlay /> : null}
    </div>
  )
}
