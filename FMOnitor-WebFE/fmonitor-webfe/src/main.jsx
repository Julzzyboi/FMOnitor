import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { config } from '@fortawesome/fontawesome-svg-core'
import './index.css'
import App from './App.jsx'

// @fortawesome/react-fontawesome auto-injects its own CSS (.svg-inline--fa { height: 1em })
// which fights with Tailwind's h-*/w-* utilities on the icons. Disable it and size icons
// purely through Tailwind classes instead.
config.autoAddCss = false

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
