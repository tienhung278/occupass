import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Badge, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes'
import { LoadingOverlay } from '../components/loading-overlay'
import { fetchOrderDetail } from '../features/orders/api'
import { formatCurrency, formatDate, safeText } from '../lib/formatters'

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

export function OrderDetailPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const parsedOrderId = Number(orderId)
  const isValidOrderId = Number.isInteger(parsedOrderId) && parsedOrderId > 0

  const orderQuery = useQuery({
    queryKey: ['order-detail', parsedOrderId],
    queryFn: () => fetchOrderDetail(parsedOrderId),
    enabled: isValidOrderId,
  })

  if (!isValidOrderId) {
    return (
      <Card>
        <Text color="red">Invalid order id.</Text>
      </Card>
    )
  }

  if (orderQuery.isLoading) {
    return (
      <Card>
        <div className="loading-panel">
          <LoadingOverlay label="Loading order..." />
        </div>
      </Card>
    )
  }

  if (orderQuery.error) {
    return (
      <Card>
        <Text color="red">{(orderQuery.error as Error).message}</Text>
      </Card>
    )
  }

  const order = orderQuery.data
  if (!order) {
    return (
      <Card>
        <Text>Order not found.</Text>
      </Card>
    )
  }

  return (
    <Flex direction="column" gap="4">
      <Flex align="center" justify="between">
        <Heading size="6">Order {order.orderId ?? orderId}</Heading>
        <Badge size="2" color="gray">
          {safeText(order.customerId)}
        </Badge>
      </Flex>

      <Card>
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {labelValue('Order Date', formatDate(order.orderDate))}
          {labelValue('Required Date', formatDate(order.requiredDate))}
          {labelValue('Shipped Date', formatDate(order.shippedDate))}
          {labelValue('Ship Name', safeText(order.shipName))}
          {labelValue('Ship Address', safeText(order.shipAddress))}
          {labelValue('Ship City', safeText(order.shipCity))}
          {labelValue('Ship Region', safeText(order.shipRegion))}
          {labelValue('Ship Postal Code', safeText(order.shipPostalCode))}
          {labelValue('Ship Country', safeText(order.shipCountry))}
          {labelValue('Freight', formatCurrency(order.freight))}
        </Grid>
      </Card>

      <Card>
        <Flex direction="column" gap="2">
          <Heading size="4">Related Records</Heading>
          <Text size="2" color="gray">
            Customer:
            {order.customerId ? (
              <>
                {' '}
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: order.customerId }}
                  className="row-link"
                >
                  {order.customer?.companyName ?? order.customerId}
                </Link>
              </>
            ) : (
              ' N/A'
            )}
          </Text>
        </Flex>
      </Card>

      <Card>
        <Heading size="4" mb="3">
          Order Lines
        </Heading>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.orderDetails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-status">
                    No line items found.
                  </td>
                </tr>
              ) : (
                order.orderDetails.map((line, index) => {
                  const lineTotal = line.unitPrice * line.quantity * (1 - line.discount)
                  const lineKey = `${line.product?.id ?? 'unknown-product'}-${index}`

                  return (
                    <tr key={lineKey}>
                      <td>{line.product?.productName ?? line.product?.id ?? 'Unknown product'}</td>
                      <td>{line.quantity}</td>
                      <td>{formatCurrency(line.unitPrice)}</td>
                      <td>{Math.round(line.discount * 100)}%</td>
                      <td>{formatCurrency(lineTotal)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Flex>
  )
}
