import { Box, Container, Flex, Heading, Text, Theme } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Theme appearance="light" accentColor="amber" grayColor="sage">
      <Container size="4" className="app-shell">
        <Flex align="center" justify="between" className="topbar">
          <Box>
            <Heading size="6">OccuPass Northwind Explorer</Heading>
            <Text size="2" color="gray">
              React + GraphQL with cursor paging
            </Text>
          </Box>
          <Flex gap="2">
            <Link
              to="/orders"
              className="nav-link"
              activeProps={{ className: 'nav-link nav-link-active' }}
            >
              Orders
            </Link>
            <Link
              to="/customers"
              className="nav-link"
              activeProps={{ className: 'nav-link nav-link-active' }}
            >
              Customers
            </Link>
          </Flex>
        </Flex>
        <Box className="page-content">{children}</Box>
      </Container>
    </Theme>
  )
}
