import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { Button, Card, Flex, Heading, Text } from '@radix-ui/themes'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DataTable } from '../components/data-table'
import {
  fetchOrdersPage,
  type OrderFilters,
  type OrderRow,
  type OrderSortColumn,
  type SortDirection,
} from '../features/orders/api'
import { formatCurrency, formatDate, safeText } from '../lib/formatters'

const pageSize = 12

const filterSchema = z.object({
  customerId: z.string().max(20),
  shipName: z.string().max(80),
  shipCountry: z.string().max(80),
  shipCity: z.string().max(80),
})

type FilterFormValues = z.infer<typeof filterSchema>

const defaultFilters: FilterFormValues = {
  customerId: '',
  shipName: '',
  shipCountry: '',
  shipCity: '',
}

function sortLabel(current: { column: OrderSortColumn; direction: SortDirection }, column: OrderSortColumn) {
  if (current.column !== column) {
    return ''
  }

  return current.direction === 'ASC' ? '↑' : '↓'
}

export function OrdersListPage() {
  const [filters, setFilters] = useState<OrderFilters>(defaultFilters)
  const [sort, setSort] = useState<{ column: OrderSortColumn; direction: SortDirection }>({
    column: 'orderDate',
    direction: 'DESC',
  })
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([null])
  const [cursorIndex, setCursorIndex] = useState(0)

  const currentCursor = cursorHistory[cursorIndex] ?? null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: defaultFilters,
  })

  const ordersQuery = useQuery({
    queryKey: ['orders-list', filters, sort.column, sort.direction, currentCursor],
    queryFn: () =>
      fetchOrdersPage({
        first: pageSize,
        after: currentCursor,
        filters,
        sortColumn: sort.column,
        sortDirection: sort.direction,
      }),
    placeholderData: (previousData) => previousData,
  })

  function resetPaging() {
    setCursorHistory([null])
    setCursorIndex(0)
  }

  function applyFilters(values: FilterFormValues) {
    setFilters(values)
    resetPaging()
  }

  function clearFilters() {
    reset(defaultFilters)
    setFilters(defaultFilters)
    resetPaging()
  }

  function toggleSort(column: OrderSortColumn) {
    setSort((previous) => {
      if (previous.column === column) {
        return {
          column,
          direction: previous.direction === 'ASC' ? 'DESC' : 'ASC',
        }
      }

      return {
        column,
        direction: 'ASC',
      }
    })
    resetPaging()
  }

  function goToNextPage() {
    const endCursor = ordersQuery.data?.pageInfo.endCursor ?? null
    if (!ordersQuery.data?.pageInfo.hasNextPage || !endCursor) {
      return
    }

    setCursorHistory((history) => {
      const next = history.slice(0, cursorIndex + 1)
      next.push(endCursor)
      return next
    })
    setCursorIndex((index) => index + 1)
  }

  function goToPreviousPage() {
    setCursorIndex((index) => Math.max(0, index - 1))
  }

  const columnHelper = createColumnHelper<OrderRow>()

  const columns = [
    columnHelper.accessor('orderId', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('orderId')}>
          Order ID {sortLabel(sort, 'orderId')}
        </button>
      ),
      cell: (context) => {
        const orderId = context.getValue()
        if (orderId === null) {
          return 'N/A'
        }

        return (
          <Link to="/orders/$orderId" params={{ orderId: String(orderId) }} className="row-link">
            {orderId}
          </Link>
        )
      },
    }),
    columnHelper.accessor('customerId', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('customerId')}>
          Customer ID {sortLabel(sort, 'customerId')}
        </button>
      ),
      cell: (context) => {
        const customerId = context.getValue()
        if (!customerId) {
          return 'N/A'
        }

        return (
          <Link
            to="/customers/$customerId"
            params={{ customerId }}
            className="row-link"
          >
            {customerId}
          </Link>
        )
      },
    }),
    columnHelper.accessor('shipName', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('shipName')}>
          Ship Name {sortLabel(sort, 'shipName')}
        </button>
      ),
      cell: (context) => safeText(context.getValue()),
    }),
    columnHelper.accessor('shipCountry', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('shipCountry')}>
          Country {sortLabel(sort, 'shipCountry')}
        </button>
      ),
      cell: (context) => safeText(context.getValue()),
    }),
    columnHelper.accessor('orderDate', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('orderDate')}>
          Order Date {sortLabel(sort, 'orderDate')}
        </button>
      ),
      cell: (context) => formatDate(context.getValue()),
    }),
    columnHelper.accessor('freight', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('freight')}>
          Freight {sortLabel(sort, 'freight')}
        </button>
      ),
      cell: (context) => formatCurrency(context.getValue()),
    }),
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: ordersQuery.data?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Flex direction="column" gap="4">
      <Heading size="6">Orders</Heading>

      <Card>
        <form onSubmit={handleSubmit(applyFilters)} className="filters-form">
          <div className="filters-grid">
            <label className="filter-field">
              <span>Customer ID</span>
              <input {...register('customerId')} placeholder="VINET" />
              {errors.customerId ? <small>{errors.customerId.message}</small> : null}
            </label>
            <label className="filter-field">
              <span>Ship Name</span>
              <input {...register('shipName')} placeholder="Hanari Carnes" />
              {errors.shipName ? <small>{errors.shipName.message}</small> : null}
            </label>
            <label className="filter-field">
              <span>Ship Country</span>
              <input {...register('shipCountry')} placeholder="Brazil" />
              {errors.shipCountry ? <small>{errors.shipCountry.message}</small> : null}
            </label>
            <label className="filter-field">
              <span>Ship City</span>
              <input {...register('shipCity')} placeholder="Rio de Janeiro" />
              {errors.shipCity ? <small>{errors.shipCity.message}</small> : null}
            </label>
          </div>

          <Flex gap="2" justify="end">
            <Button type="button" variant="soft" onClick={clearFilters}>
              Reset
            </Button>
            <Button type="submit">Apply Filters</Button>
          </Flex>
        </form>
      </Card>

      {ordersQuery.error ? (
        <Card>
          <Text color="red">
            {(ordersQuery.error as Error).message}
          </Text>
        </Card>
      ) : null}

      <Card>
        <DataTable
          table={table}
          isLoading={ordersQuery.isFetching}
          emptyLabel="No orders found for the selected filters."
        />
      </Card>

      <Flex align="center" justify="between">
        <Text size="2" color="gray">
          Page {cursorIndex + 1}
        </Text>
        <Flex gap="2">
          <Button variant="soft" onClick={goToPreviousPage} disabled={cursorIndex === 0}>
            Previous
          </Button>
          <Button
            onClick={goToNextPage}
            disabled={!ordersQuery.data?.pageInfo.hasNextPage || ordersQuery.isFetching}
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
