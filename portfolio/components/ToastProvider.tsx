// components/ToastProvider.tsx
'use client'

import { ToastContainer } from 'react-toastify'
import { useTheme } from 'next-themes'
import 'react-toastify/dist/ReactToastify.css'

export function ToastProvider() {
    const { resolvedTheme } = useTheme()
    return (
        <ToastContainer
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            draggable
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        />
    )
}