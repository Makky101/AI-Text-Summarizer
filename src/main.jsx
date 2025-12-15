// Import React components for app initialization
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import global styles
import './index.css'

// Import the main App component
import App from './App.jsx'

// Create React root and render the application
// StrictMode helps detect potential problems in development
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
