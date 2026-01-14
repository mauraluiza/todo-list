import { OrganizationProvider } from './contexts/OrganizationProvider'
import { AuthProvider } from './contexts/AuthProvider'
import { ThemeProvider } from './contexts/ThemeProvider'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <AuthProvider>
                <OrganizationProvider>
                    <App />
                </OrganizationProvider>
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>,
)
