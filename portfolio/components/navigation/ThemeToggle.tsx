'use client'

import { useTheme } from 'next-themes'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

export function ThemeToggle() {
    const { setTheme } = useTheme()

    function toggle() {
        const isDark = document.documentElement.classList.contains('dark')
        setTheme(isDark ? 'light' : 'dark')
    }

    return (
        <button
            type="button"
            onClick={toggle}
            className=""
            aria-label="Alternar tema"
        >
            <span className="dark:hidden">
                <div className="flex flex-col text-xs items-center justify-center rounded-md transition-all duration-300">
                    <LightModeOutlinedIcon style={{ transition: 'transform 0.3s ease-in-out', transform: 'rotate(360deg)' }} />
                </div>
            </span>

            <span className="hidden dark:inline">
                <div className="flex flex-col text-xs items-center justify-center rounded-md transition-all duration-300">
                    <DarkModeOutlinedIcon style={{ transition: 'transform 0.3s ease-in-out', transform: 'rotate(360deg)' }} />
                </div>
            </span>
        </button>
    )
}
