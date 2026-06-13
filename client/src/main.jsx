import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { UiProvider } from './components/UiProvider.jsx'

axios.defaults.baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')
axios.defaults.timeout = 30000

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UiProvider><App /></UiProvider>
  </React.StrictMode>,
)
