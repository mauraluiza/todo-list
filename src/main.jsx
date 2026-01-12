import { WorkspaceProvider } from './components/WorkspaceProvider'
import { AuthProvider } from './components/AuthProvider'
import { ThemeProvider } from './components/ThemeProvider'
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
