import { ClientError, GraphQLClient } from 'graphql-request'

const LOCAL_PROXY_ENDPOINT = '/graphql/'
const FALLBACK_BASE_URL = 'http://localhost'

function toAbsoluteEndpoint(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }

  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const base = typeof window !== 'undefined' ? window.location.origin : FALLBACK_BASE_URL
  return new URL(normalized, base).toString()
}

function resolveApiEndpoint(): string {
  const configured = import.meta.env.VITE_GRAPHQL_ENDPOINT?.trim() ?? ''
  const hasConfigured = configured.length > 0

  // Keep development requests same-origin so Vite proxy can avoid browser CORS blocks.
  if (import.meta.env.DEV && (!hasConfigured || /^https?:\/\//i.test(configured))) {
    return toAbsoluteEndpoint(LOCAL_PROXY_ENDPOINT)
  }

  const candidate = hasConfigured ? configured : LOCAL_PROXY_ENDPOINT

  try {
    return toAbsoluteEndpoint(candidate)
  } catch {
    return toAbsoluteEndpoint(LOCAL_PROXY_ENDPOINT)
  }
}

const API_ENDPOINT = resolveApiEndpoint()

const graphQLClient = new GraphQLClient(API_ENDPOINT)

export async function requestGraphQL<TData, TVariables extends object>(
  document: string,
  variables: TVariables,
): Promise<TData> {
  try {
    return await graphQLClient.request<TData>(document, variables)
  } catch (error) {
    if (error instanceof ClientError) {
      const details = error.response.errors?.map((entry) => entry.message).join(', ')
      throw new Error(details ?? 'GraphQL request failed')
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Unknown request failure')
  }
}
