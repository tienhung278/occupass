import { Outlet } from '@tanstack/react-router'
import { AppLayout } from './app-layout'

export function RootLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
