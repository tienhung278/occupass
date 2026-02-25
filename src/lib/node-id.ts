interface DecodedNodeId {
  type: string
  entityId: string
}

export function encodeNodeId(type: string, entityId: string): string {
  return btoa(`${type}:${entityId}`)
}

export function decodeNodeId(nodeId: string): DecodedNodeId | null {
  try {
    const decoded = atob(nodeId)
    const separatorIndex = decoded.indexOf(':')

    if (separatorIndex <= 0) {
      return null
    }

    const type = decoded.slice(0, separatorIndex)
    const entityId = decoded.slice(separatorIndex + 1)

    if (!entityId) {
      return null
    }

    return { type, entityId }
  } catch {
    return null
  }
}

export function getOrderIdFromNodeId(nodeId: string): number | null {
  const decoded = decodeNodeId(nodeId)

  if (!decoded || decoded.type !== 'Order') {
    return null
  }

  const orderId = Number(decoded.entityId)
  return Number.isInteger(orderId) ? orderId : null
}

export function getCustomerIdFromNodeId(nodeId: string): string | null {
  const decoded = decodeNodeId(nodeId)

  if (!decoded || decoded.type !== 'Customer') {
    return null
  }

  return decoded.entityId
}
