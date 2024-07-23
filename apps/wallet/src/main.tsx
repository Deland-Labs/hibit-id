import React from 'react'
import ReactDOM from 'react-dom/client'
import 'reflect-metadata'
import { RUNTIME_ENV, RUNTIME_PARAMS } from './utils/runtime.ts'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './apis/index.ts'
import { RuntimeEnv } from './utils/basicEnums.ts'
import rpcManager from './stores/rpc.ts'
import './i18n'

console.log('[runtime env]', RUNTIME_ENV)
console.log('[runtime params]', RUNTIME_PARAMS)

if (RUNTIME_ENV === RuntimeEnv.SDK) {
  rpcManager.init()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
