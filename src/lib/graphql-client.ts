import { ClientError, GraphQLClient } from 'graphql-request'

const REMOTE_ENDPOINT = 'https://gqltest.occupass.com/graphql/'

function resolveApiEndpoint(): string {
  const configured = import.meta.env.VITE_GRAPHQL_ENDPOINT?.trim()
  const candidate = configured && configured.length > 0
    ? configured
    : import.meta.env.DEV
      ? '/graphql/'
      : REMOTE_ENDPOINT

  try {
    if (/^https?:\/\//i.test(candidate)) {
      return candidate
    }

    const base = typeof window !== 'undefined' ? window.location.origin : REMOTE_ENDPOINT
    return new URL(candidate, base).toString()
  } catch {
    return REMOTE_ENDPOINT
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
