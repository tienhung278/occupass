import { requestGraphQL } from '../../lib/graphql-client'
import { encodeNodeId, getCustomerIdFromNodeId } from '../../lib/node-id'
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

interface CustomerListNode {
  id: string
  companyName: string
  contactName: string | null
  city: string | null
  country: string | null
}

interface CustomersConnectionResponse {
  customers: {
    nodes: CustomerListNode[]
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

interface CustomersConnectionVariables {
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
  const entries = [
    buildContainsFilter('customerId', filters.customerId),
    buildContainsFilter('companyName', filters.companyName),
    buildContainsFilter('contactName', filters.contactName),
    buildContainsFilter('city', filters.city),
    buildContainsFilter('country', filters.country),
  ].filter((entry): entry is string => entry !== null)

  if (entries.length === 0) {
    return null
  }

  return `{ ${entries.join(', ')} }`
}

function buildCustomerSort(column: CustomerSortColumn, direction: SortDirection): string {
  return `[{ ${column}: ${direction} }]`
}

function createCustomersQuery(whereClause: string | null, orderClause: string): string {
  const whereArgument = whereClause ? `, where: ${whereClause}` : ''

  return `
    query CustomersList($first: Int!, $after: String) {
      customers(first: $first, after: $after${whereArgument}, order: ${orderClause}) {
        nodes {
          id
          companyName
          contactName
          city
          country
        }
        pageInfo {
          hasNextPage
          endCursor
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
  const query = createCustomersQuery(whereClause, orderClause)
  const response = await requestGraphQL<CustomersConnectionResponse, CustomersConnectionVariables>(
    query,
    {
      first: params.first,
      after: params.after,
    },
  )

  const rows: CustomerListRow[] = []
  for (const node of response.customers.nodes) {
    const customerId = getCustomerIdFromNodeId(node.id)
    if (!customerId) {
      continue
    }

    rows.push({
      customerId,
      nodeId: node.id,
      companyName: node.companyName,
      contactName: node.contactName,
      city: node.city,
      country: node.country,
    })
  }

  return {
    rows,
    nextCursor: response.customers.pageInfo.endCursor,
    hasNextPage: response.customers.pageInfo.hasNextPage,
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
