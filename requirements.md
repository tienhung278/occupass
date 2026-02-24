Purpose
This project provides a means for candidates to demonstrate their skills using the React framework and GraphQL data fetching. Candidates should ensure that their emphasis is on the solution architecture and user experience, not just writing code. Any suitable NPM package or design system (e.g., MUI, Ant Design, Tailwind) may be used.

The solution must be submitted as a public GitHub repository. It must be usable by a reviewer via npm install and npm start. Provide any necessary notes in a readme.md at the root.

Specifications
API Endpoint: https://gqltest.occupass.com/graphql/
Documentation: Explore the schema and available queries using the Apollo/GraphQL playground at the endpoint above.
The API provides access to Customers and Orders based on the Northwind dataset.

Requirements:
• Navigation: Create a basic application with a menu/navigation bar.
• Views: * Separate list views for Customers and Orders.
Detailed views for a single Customer (showing profile details and their associated list of orders).

Detailed views for a single Order.
• Data Handling: * Filtering & Sorting: Users must be able to filter and sort the data by available columns in the list views.
Paging: Implement server-side paging using GraphQL arguments (e.g., skip, take, or cursor-based as supported by the schema).
• Integration: Use a GraphQL client (e.g., Apollo Client, Urql, Relay or TanStack Query) to manage state and caching.

UI Techstack
Vite with SPA mode - https://vite.dev;
React + TypeScript - https://react.dev;
TanStack Router - https://tanstack.com/router/latest;
TanStack Query - https://tanstack.com/query/latest;
TanStack Table (due to amount of tables to be used) - https://tanstack.com/table/latest;
React Hook Form - https://www.react-hook-form.com;
Zod - https://zod.dev;
Radix-UI/Themes or ShadCn for components. 

Please don't use any server-side frameworks for this test. We prefer that the solution is completed using a strictly client-side approach.