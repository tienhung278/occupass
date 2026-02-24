import { requestGraphQL } from '../../lib/graphql-client'
import { getOrderIdFromNodeId } from '../../lib/node-id'

export type SortDirection = 'ASC' | 'DESC'

export type OrderSortColumn =
  | 'orderId'
  | 'customerId'
  | 'orderDate'
  | 'shipName'
  | 'shipCountry'
  | 'freight'

export interface OrderFilters {
  customerId: string
  shipName: string
  shipCountry: string
  shipCity: string
}

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface CustomerSummary {
  id: string
  companyName: string
  contactName: string | null
  city: string | null
  country: string | null
}

export interface OrderRow {
  id: string
  orderId: number | null
  customerId: string | null
  orderDate: string | null
  shipName: string | null
  shipCountry: string | null
  shipCity: string | null
  freight: number | null
  customer: CustomerSummary | null
}

export interface OrdersPage {
  rows: OrderRow[]
  pageInfo: PageInfo
}

export interface OrderLineItem {
  orderId: string
  productId: string
  unitPrice: number
  quantity: number
  discount: number
  product: {
    id: string
    productName: string
    unitPrice: number | null
    quantityPerUnit: string | null
  } | null
}

export interface OrderDetail extends OrderRow {
  requiredDate: string | null
  shippedDate: string | null
  shipAddress: string | null
  shipRegion: string | null
  shipPostalCode: string | null
  shipVia: number | null
  employeeId: number | null
  orderDetails: OrderLineItem[]
}

interface QueryOrderNode {
  id: string
  customerId: string | null
  orderDate: string | null
  shipName: string | null
  shipCountry: string | null
  shipCity: string | null
  freight: number | null
  customer: CustomerSummary | null
}

interface OrdersConnectionResponse {
  orders: {
    nodes: QueryOrderNode[]
    pageInfo: PageInfo
  }
}

interface OrdersConnectionVariables {
  first: number
  after: string | null
}

interface OrderDetailNode extends QueryOrderNode {
  requiredDate: string | null
  shippedDate: string | null
  shipAddress: string | null
  shipRegion: string | null
  shipPostalCode: string | null
  shipVia: number | null
  employeeId: number | null
  orderDetails: OrderLineItem[]
}

interface OrderDetailResponse {
  orders: {
    nodes: OrderDetailNode[]
  }
}

interface OrderDetailVariables {
  orderId: number
}

const ORDER_DETAIL_QUERY = `
  query OrderDetail($orderId: Short!) {
    orders(first: 1, where: { orderId: { eq: $orderId } }) {
      nodes {
        id
        customerId
        orderDate
        requiredDate
        shippedDate
        shipName
        shipAddress
        shipCity
        shipRegion
        shipPostalCode
        shipCountry
        shipVia
        freight
        employeeId
        customer {
          id
          companyName
          contactName
          city
          country
        }
        orderDetails {
          orderId
          productId
          unitPrice
          quantity
          discount
          product {
            id
            productName
            unitPrice
            quantityPerUnit
          }
        }
      }
    }
  }
`

function toOrderRow(node: QueryOrderNode): OrderRow {
  return {
    id: node.id,
    orderId: getOrderIdFromNodeId(node.id),
    customerId: node.customerId,
    orderDate: node.orderDate,
    shipName: node.shipName,
    shipCountry: node.shipCountry,
    shipCity: node.shipCity,
    freight: node.freight,
    customer: node.customer,
  }
}

function buildOrderSort(column: OrderSortColumn, direction: SortDirection): string {
  return `[{ ${column}: ${direction} }]`
}

function buildContainsFilter(field: string, value: string): string | null {
  const normalized = value.trim()
  if (normalized.length > 0) {
    return `${field}: { contains: ${JSON.stringify(normalized)} }`
  }

  return null
}

function buildOrderWhere(filters: OrderFilters): string | null {
  const entries = [
    buildContainsFilter('customerId', filters.customerId),
    buildContainsFilter('shipName', filters.shipName),
    buildContainsFilter('shipCountry', filters.shipCountry),
    buildContainsFilter('shipCity', filters.shipCity),
  ].filter((entry): entry is string => entry !== null)

  if (entries.length === 0) {
    return null
  }

  return `{ ${entries.join(', ')} }`
}

function createOrdersListQuery(whereClause: string | null, orderClause: string): string {
  const whereArgument = whereClause ? `, where: ${whereClause}` : ''

  return `
    query OrdersList($first: Int!, $after: String) {
      orders(first: $first, after: $after${whereArgument}, order: ${orderClause}) {
        nodes {
          id
          customerId
          orderDate
          shipName
          shipCountry
          shipCity
          freight
          customer {
            id
            companyName
            contactName
            city
            country
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `
}

export async function fetchOrdersPage(params: {
  first: number
  after: string | null
  filters: OrderFilters
  sortColumn: OrderSortColumn
  sortDirection: SortDirection
}): Promise<OrdersPage> {
  const whereClause = buildOrderWhere(params.filters)
  const orderClause = buildOrderSort(params.sortColumn, params.sortDirection)
  const query = createOrdersListQuery(whereClause, orderClause)

  const response = await requestGraphQL<OrdersConnectionResponse, OrdersConnectionVariables>(
    query,
    {
      first: params.first,
      after: params.after,
    },
  )

  return {
    rows: response.orders.nodes.map(toOrderRow),
    pageInfo: response.orders.pageInfo,
  }
}

export async function fetchOrdersForCustomer(params: {
  customerId: string
  first: number
  after: string | null
  sortColumn: OrderSortColumn
  sortDirection: SortDirection
}): Promise<OrdersPage> {
  const orderClause = buildOrderSort(params.sortColumn, params.sortDirection)
  const whereClause = `{ customerId: { eq: ${JSON.stringify(params.customerId)} } }`
  const query = createOrdersListQuery(whereClause, orderClause)

  const response = await requestGraphQL<OrdersConnectionResponse, OrdersConnectionVariables>(
    query,
    {
      first: params.first,
      after: params.after,
    },
  )

  return {
    rows: response.orders.nodes.map(toOrderRow),
    pageInfo: response.orders.pageInfo,
  }
}

export async function fetchOrderDetail(orderId: number): Promise<OrderDetail | null> {
  const response = await requestGraphQL<OrderDetailResponse, OrderDetailVariables>(ORDER_DETAIL_QUERY, {
    orderId,
  })
  const node = response.orders.nodes[0]

  if (!node) {
    return null
  }

  return {
    ...toOrderRow(node),
    requiredDate: node.requiredDate,
    shippedDate: node.shippedDate,
    shipAddress: node.shipAddress,
    shipRegion: node.shipRegion,
    shipPostalCode: node.shipPostalCode,
    shipVia: node.shipVia,
    employeeId: node.employeeId,
    orderDetails: node.orderDetails,
  }
}
