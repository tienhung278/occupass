import { useQuery } from '@tanstack/react-query'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Link, useParams } from '@tanstack/react-router'
import { Badge, Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import { DataTable } from '../components/data-table'
import { LoadingOverlay } from '../components/loading-overlay'
import { fetchCustomerById } from '../features/customers/api'
import {
  fetchOrdersForCustomer,
  type OrderRow,
  type OrderSortColumn,
  type SortDirection,
} from '../features/orders/api'
import { formatCurrency, formatDate, safeText } from '../lib/formatters'

const pageSize = 8

function sortLabel(current: { column: OrderSortColumn; direction: SortDirection }, column: OrderSortColumn) {
  if (current.column !== column) {
    return ''
  }

  return current.direction === 'ASC' ? '↑' : '↓'
}

function labelValue(label: string, value: string) {
  return (
    <Flex direction="column" gap="1">
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text>{value}</Text>
    </Flex>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams({ from: '/customers/$customerId' })

  const [sort, setSort] = useState<{ column: OrderSortColumn; direction: SortDirection }>({
    column: 'orderDate',
    direction: 'DESC',
  })
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([null])
  const [cursorIndex, setCursorIndex] = useState(0)

  const currentCursor = cursorHistory[cursorIndex] ?? null

  const customerQuery = useQuery({
    queryKey: ['customer-profile', customerId],
    queryFn: () => fetchCustomerById(customerId),
  })

  useEffect(() => {
    setCursorHistory([null])
    setCursorIndex(0)
  }, [customerId])

  const ordersQuery = useQuery({
    queryKey: ['customer-orders', customerId, currentCursor, sort.column, sort.direction],
    queryFn: () =>
      fetchOrdersForCustomer({
        customerId,
        first: pageSize,
        after: currentCursor,
        sortColumn: sort.column,
        sortDirection: sort.direction,
      }),
    placeholderData: (previousData) => previousData,
  })

  function resetPaging() {
    setCursorHistory([null])
    setCursorIndex(0)
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
    columnHelper.accessor('orderDate', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('orderDate')}>
          Order Date {sortLabel(sort, 'orderDate')}
        </button>
      ),
      cell: (context) => formatDate(context.getValue()),
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

  if (customerQuery.isLoading) {
    return (
      <Card>
        <div className="loading-panel">
          <LoadingOverlay label="Loading customer..." />
        </div>
      </Card>
    )
  }

  if (customerQuery.error) {
    return (
      <Card>
        <Text color="red">{(customerQuery.error as Error).message}</Text>
      </Card>
    )
  }

  const customer = customerQuery.data

  if (!customer) {
    return (
      <Card>
        <Text>Customer not found.</Text>
      </Card>
    )
  }

  return (
    <Flex direction="column" gap="4">
      <Flex align="center" justify="between">
        <Heading size="6">{customer.companyName}</Heading>
        <Badge>{customerId}</Badge>
      </Flex>

      <Card>
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {labelValue('Contact', safeText(customer.contactName))}
          {labelValue('Title', safeText(customer.contactTitle))}
          {labelValue('Phone', safeText(customer.phone))}
          {labelValue('Fax', safeText(customer.fax))}
          {labelValue('Address', safeText(customer.address))}
          {labelValue('City', safeText(customer.city))}
          {labelValue('Region', safeText(customer.region))}
          {labelValue('Postal Code', safeText(customer.postalCode))}
          {labelValue('Country', safeText(customer.country))}
        </Grid>
      </Card>

      <Card>
        <Heading size="4" mb="3">
          Orders
        </Heading>

        {ordersQuery.error ? (
          <Text color="red">{(ordersQuery.error as Error).message}</Text>
        ) : (
          <DataTable
            table={table}
            isLoading={ordersQuery.isFetching}
            emptyLabel="No orders found for this customer."
          />
        )}

        <Flex align="center" justify="between" mt="3">
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
      </Card>
    </Flex>
  )
}
