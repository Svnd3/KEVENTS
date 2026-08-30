import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { CurrencyProvider } from './components/CurrencyControl.jsx'
import SiteLoader from './components/SiteLoader.jsx'
import './styles.css'
import './design-variants.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurrencyProvider>
      <SiteLoader />
      <App />
    </CurrencyProvider>
  </StrictMode>,
)
