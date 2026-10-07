import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { config } from '@fortawesome/fontawesome-svg-core'
import './index.css'
import './utils/sessionGuard'
import App from './App.jsx'

config.autoAddCss = false

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
