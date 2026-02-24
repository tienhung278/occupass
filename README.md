# OccuPass GraphQL Assignment

Client-side SPA built with Vite + React + TypeScript, using:
- TanStack Router
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Radix Themes

## Run

```bash
npm install
npm run dev
```

Dev mode uses a Vite proxy (`/graphql` -> `https://gqltest.occupass.com`) to avoid browser CORS issues.

Optional endpoint override:

```bash
# .env.local
VITE_GRAPHQL_ENDPOINT=https://gqltest.occupass.com/graphql/
```

Production build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Implemented Screens

- `Orders` list
  - Server-side cursor paging (`first`, `after`)
  - Server-side filtering (`where`)
  - Server-side sorting (`order`)
  - Row link to order detail
- `Order detail`
  - Profile fields + line items
  - Link to customer detail
- `Customers` list
  - Separate customer view
  - Filtering and sorting controls
  - Cursor paging backed by GraphQL order stream
- `Customer detail`
  - Profile fields
  - Associated orders table with cursor paging + sorting

## Important Schema Note

The API schema at `https://gqltest.occupass.com/graphql/?sdl` currently does **not** expose a top-level `customers` query on `Query`.

Available root fields are:
- `orders`
- `products`
- `employees`
- `node`
- `nodes`

Because of this, the customer list is derived from paged `orders` results (deduplicated by `customerId`), while customer detail is fetched via `node(id: ...)`.
