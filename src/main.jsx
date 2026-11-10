import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/inter'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ToastProvider from './components/ToastProvider.jsx'
import { PlannerProvider } from './state/PlannerContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <PlannerProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </PlannerProvider>
    </HashRouter>
  </StrictMode>,
)
