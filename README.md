# OccuPass GraphQL Assignment

Client-side SPA built with Vite, React 19, and TypeScript.

## Stack

- Vite + React + TypeScript
- TanStack Router
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Radix Themes
- GraphQL Request

## Getting Started

```bash
npm install
npm run dev
```

The app runs on Vite dev server (default: `http://localhost:5173`).

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Routes

- `/` redirects to `/orders`
- `/orders`
- `/orders/$orderId`
- `/customers`
- `/customers/$customerId`

## API Configuration

### Development (`npm run dev`)

- Client requests are sent to `/graphql/`.
- Vite proxies `/graphql` traffic to `https://gqltest.occupass.com`.
- If `VITE_GRAPHQL_ENDPOINT` is an absolute URL, the app still uses `/graphql/` in dev to avoid browser CORS issues and rely on the proxy.

### Production (`npm run build` + `npm run preview` or deployed build)

- If `VITE_GRAPHQL_ENDPOINT` is set, that value is used.
- If `VITE_GRAPHQL_ENDPOINT` is empty, the app falls back to `/graphql/` on the same origin.

Example:

```bash
# .env
VITE_GRAPHQL_ENDPOINT=https://gqltest.occupass.com/graphql/
```

## Implemented Screens

- `Orders` list (`/orders`): server-side cursor paging, filtering, sorting, and row links to order/customer detail pages.
- `Order detail` (`/orders/$orderId`): order profile fields, line items with calculated totals, and link to related customer.
- `Customers` list (`/customers`): server-side cursor paging, filtering, sorting, and row links to customer detail.
- `Customer detail` (`/customers/$customerId`): customer profile fields and related orders table with sorting and cursor paging.

## Data Access Notes

- Customer list uses the `customers(...)` GraphQL connection.
- Customer detail uses `node(id: ...)`, with encoded node IDs in the form `Customer:<customerId>` (base64).
- Order IDs displayed in tables/details are decoded from GraphQL node IDs in the form `Order:<orderId>`.
