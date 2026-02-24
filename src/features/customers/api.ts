import { requestGraphQL } from '../../lib/graphql-client'
import { encodeNodeId } from '../../lib/node-id'
import type { SortDirection } from '../orders/api'

export type CustomerSortColumn = 'customerId' | 'companyName' | 'contactName' | 'city' | 'country'

export interface CustomerFilters {
  customerId: string
  companyName: string
  contactName: string
  city: string
  country: string
}

export interface CustomerListRow {
  customerId: string
  nodeId: string
  companyName: string
  contactName: string | null
  city: string | null
  country: string | null
}

export interface CustomerProfile {
  id: string
  companyName: string
  contactName: string | null
  contactTitle: string | null
  address: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  phone: string | null
  fax: string | null
}

export interface CustomersPage {
  rows: CustomerListRow[]
  nextCursor: string | null
  hasNextPage: boolean
}

interface CustomerOrderEdge {
  cursor: string
  node: {
    customerId: string | null
    customer: {
      id: string
      companyName: string
      contactName: string | null
      city: string | null
      country: string | null
    } | null
  }
}

interface CustomersFromOrdersResponse {
  orders: {
    edges: CustomerOrderEdge[]
    pageInfo: {
      hasNextPage: boolean
    }
  }
}

interface CustomersFromOrdersVariables {
  first: number
  after: string | null
}

interface CustomerNodeResponse {
  node: {
    __typename: string
    id: string
    companyName: string
    contactName: string | null
    contactTitle: string | null
    address: string | null
    city: string | null
    region: string | null
    postalCode: string | null
    country: string | null
    phone: string | null
    fax: string | null
  } | null
}

interface CustomerNodeVariables {
  id: string
}

const CUSTOMER_PROFILE_QUERY = `
  query CustomerProfile($id: ID!) {
    node(id: $id) {
      __typename
      ... on Customer {
        id
        companyName
        contactName
        contactTitle
        address
        city
        region
        postalCode
        country
        phone
        fax
      }
    }
  }
`

function buildContainsFilter(field: string, value: string): string | null {
  const normalized = value.trim()
  if (normalized.length > 0) {
    return `${field}: { contains: ${JSON.stringify(normalized)} }`
  }

  return null
}

function buildCustomerWhere(filters: CustomerFilters): string | null {
  const orderEntries = [buildContainsFilter('customerId', filters.customerId)].filter(
    (entry): entry is string => entry !== null,
  )

  const customerEntries = [
    buildContainsFilter('companyName', filters.companyName),
    buildContainsFilter('contactName', filters.contactName),
    buildContainsFilter('city', filters.city),
    buildContainsFilter('country', filters.country),
  ].filter((entry): entry is string => entry !== null)

  const entries = [...orderEntries]

  if (customerEntries.length > 0) {
    entries.push(`customer: { ${customerEntries.join(', ')} }`)
  }

  if (entries.length === 0) {
    return null
  }

  return `{ ${entries.join(', ')} }`
}

function buildCustomerSort(column: CustomerSortColumn, direction: SortDirection): string {
  if (column === 'customerId') {
    return `[{ customerId: ${direction} }, { orderId: ASC }]`
  }

  return `[{ customer: { ${column}: ${direction} } }, { orderId: ASC }]`
}

function createCustomersFromOrdersQuery(whereClause: string | null, orderClause: string): string {
  const whereArgument = whereClause ? `, where: ${whereClause}` : ''

  return `
    query CustomersFromOrders($first: Int!, $after: String) {
      orders(first: $first, after: $after${whereArgument}, order: ${orderClause}) {
        edges {
          cursor
          node {
            customerId
            customer {
              id
              companyName
              contactName
              city
              country
            }
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `
}

export async function fetchCustomersPage(params: {
  first: number
  after: string | null
  filters: CustomerFilters
  sortColumn: CustomerSortColumn
  sortDirection: SortDirection
}): Promise<CustomersPage> {
  const whereClause = buildCustomerWhere(params.filters)
  const orderClause = buildCustomerSort(params.sortColumn, params.sortDirection)
  const query = createCustomersFromOrdersQuery(whereClause, orderClause)
  const rowsById = new Map<string, CustomerListRow>()

  let currentCursor = params.after
  let hasNextPage = false
  let reachedPageSize = false
  let lastSeenCursor = params.after

  while (rowsById.size < params.first) {
    const response = await requestGraphQL<CustomersFromOrdersResponse, CustomersFromOrdersVariables>(
      query,
      {
        first: params.first,
        after: currentCursor,
      },
    )

    const { edges, pageInfo } = response.orders

    if (edges.length === 0) {
      hasNextPage = false
      break
    }

    hasNextPage = pageInfo.hasNextPage

    for (const edge of edges) {
      lastSeenCursor = edge.cursor
      currentCursor = edge.cursor
      const customerId = edge.node.customerId
      const customer = edge.node.customer

      if (!customerId || !customer) {
        continue
      }

      if (!rowsById.has(customerId)) {
        rowsById.set(customerId, {
          customerId,
          nodeId: customer.id,
          companyName: customer.companyName,
          contactName: customer.contactName,
          city: customer.city,
          country: customer.country,
        })
      }

      if (rowsById.size === params.first) {
        reachedPageSize = true
        break
      }
    }

    if (reachedPageSize || !hasNextPage) {
      break
    }
  }

  return {
    rows: Array.from(rowsById.values()),
    nextCursor: reachedPageSize || hasNextPage ? lastSeenCursor : null,
    hasNextPage: reachedPageSize || hasNextPage,
  }
}

export async function fetchCustomerById(customerId: string): Promise<CustomerProfile | null> {
  const nodeId = encodeNodeId('Customer', customerId)
  const response = await requestGraphQL<CustomerNodeResponse, CustomerNodeVariables>(
    CUSTOMER_PROFILE_QUERY,
    {
      id: nodeId,
    },
  )

  const node = response.node
  if (!node || node.__typename !== 'Customer') {
    return null
  }

  return {
    id: node.id,
    companyName: node.companyName,
    contactName: node.contactName,
    contactTitle: node.contactTitle,
    address: node.address,
    city: node.city,
    region: node.region,
    postalCode: node.postalCode,
    country: node.country,
    phone: node.phone,
    fax: node.fax,
  }
}
