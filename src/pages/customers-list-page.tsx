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
  fetchCustomersPage,
  type CustomerFilters,
  type CustomerListRow,
  type CustomerSortColumn,
} from '../features/customers/api'
import type { SortDirection } from '../features/orders/api'
import { safeText } from '../lib/formatters'

const pageSize = 12

const filterSchema = z.object({
  customerId: z.string().max(20),
  companyName: z.string().max(120),
  contactName: z.string().max(120),
  city: z.string().max(80),
  country: z.string().max(80),
})

type FilterFormValues = z.infer<typeof filterSchema>

const defaultFilters: FilterFormValues = {
  customerId: '',
  companyName: '',
  contactName: '',
  city: '',
  country: '',
}

function sortLabel(
  current: { column: CustomerSortColumn; direction: SortDirection },
  column: CustomerSortColumn,
) {
  if (current.column !== column) {
    return ''
  }

  return current.direction === 'ASC' ? '↑' : '↓'
}

export function CustomersListPage() {
  const [filters, setFilters] = useState<CustomerFilters>(defaultFilters)
  const [sort, setSort] = useState<{ column: CustomerSortColumn; direction: SortDirection }>({
    column: 'companyName',
    direction: 'ASC',
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

  const customersQuery = useQuery({
    queryKey: ['customers-list', filters, sort.column, sort.direction, currentCursor],
    queryFn: () =>
      fetchCustomersPage({
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

  function toggleSort(column: CustomerSortColumn) {
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
    const nextCursor = customersQuery.data?.nextCursor ?? null

    if (!customersQuery.data?.hasNextPage || !nextCursor) {
      return
    }

    setCursorHistory((history) => {
      const next = history.slice(0, cursorIndex + 1)
      next.push(nextCursor)
      return next
    })
    setCursorIndex((index) => index + 1)
  }

  function goToPreviousPage() {
    setCursorIndex((index) => Math.max(0, index - 1))
  }

  const columnHelper = createColumnHelper<CustomerListRow>()

  const columns = [
    columnHelper.accessor('customerId', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('customerId')}>
          Customer ID {sortLabel(sort, 'customerId')}
        </button>
      ),
      cell: (context) => (
        <Link
          to="/customers/$customerId"
          params={{ customerId: context.getValue() }}
          className="row-link"
        >
          {context.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('companyName', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('companyName')}>
          Company {sortLabel(sort, 'companyName')}
        </button>
      ),
      cell: (context) => safeText(context.getValue()),
    }),
    columnHelper.accessor('contactName', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('contactName')}>
          Contact {sortLabel(sort, 'contactName')}
        </button>
      ),
      cell: (context) => safeText(context.getValue()),
    }),
    columnHelper.accessor('city', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('city')}>
          City {sortLabel(sort, 'city')}
        </button>
      ),
      cell: (context) => safeText(context.getValue()),
    }),
    columnHelper.accessor('country', {
      header: () => (
        <button type="button" className="sort-button" onClick={() => toggleSort('country')}>
          Country {sortLabel(sort, 'country')}
        </button>
      ),
      cell: (context) => safeText(context.getValue()),
    }),
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: customersQuery.data?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Flex direction="column" gap="4">
      <Heading size="6">Customers</Heading>

      <Card>
        <form onSubmit={handleSubmit(applyFilters)} className="filters-form">
          <div className="filters-grid">
            <label className="filter-field">
              <span>Customer ID</span>
              <input {...register('customerId')} placeholder="ALFKI" />
              {errors.customerId ? <small>{errors.customerId.message}</small> : null}
            </label>
            <label className="filter-field">
              <span>Company</span>
              <input {...register('companyName')} placeholder="Hanari Carnes" />
              {errors.companyName ? <small>{errors.companyName.message}</small> : null}
            </label>
            <label className="filter-field">
              <span>Contact</span>
              <input {...register('contactName')} placeholder="Maria Anders" />
              {errors.contactName ? <small>{errors.contactName.message}</small> : null}
            </label>
            <label className="filter-field">
              <span>City</span>
              <input {...register('city')} placeholder="Berlin" />
              {errors.city ? <small>{errors.city.message}</small> : null}
            </label>
            <label className="filter-field">
              <span>Country</span>
              <input {...register('country')} placeholder="Germany" />
              {errors.country ? <small>{errors.country.message}</small> : null}
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

      {customersQuery.error ? (
        <Card>
          <Text color="red">{(customersQuery.error as Error).message}</Text>
        </Card>
      ) : null}

      <Card>
        <DataTable
          table={table}
          isLoading={customersQuery.isFetching}
          emptyLabel="No customers found for the selected filters."
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
            disabled={!customersQuery.data?.hasNextPage || customersQuery.isFetching}
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
