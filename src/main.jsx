import { WorkspaceProvider } from './contexts/WorkspaceProvider'
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
                <WorkspaceProvider>
                    <App />
                </WorkspaceProvider>
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>,
)
