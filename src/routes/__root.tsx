import { Outlet, createRootRoute } from '@tanstack/react-router'
// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { AuthProvider } from '../context/AuthProvider'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <Header />
      <Outlet />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 text-center">
        <p className="mt-1 text-xs text-white/50">made with ♥️ in Seoul</p>
      </div>
      {null}
    </AuthProvider>
  ),
})
