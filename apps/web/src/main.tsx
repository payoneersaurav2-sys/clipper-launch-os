import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { useAuthStore } from './stores/useAuthStore'
import { AppearanceProvider } from './components/AppearanceProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep private workspace data in memory briefly between dashboard routes.
      // Mutations still invalidate their matching queries immediately.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Initialize auth session before rendering
useAuthStore.getState().initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <App />
      </AppearanceProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
