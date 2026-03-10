import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--es-black-secondary)',
            color: 'var(--es-gold-primary)',
            border: '1px solid var(--es-border-gold)',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: {
              primary: 'var(--es-gold-primary)',
              secondary: 'var(--es-black-secondary)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--es-error)',
              secondary: 'var(--es-white-pure)',
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
