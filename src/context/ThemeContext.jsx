import React, { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export const PortfolioThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const setLightMode = () => {
        document.querySelector("body").setAttribute("data-theme", "light");
        localStorage.setItem('theme', 'light');
        setTheme("light");
    }

    const setDarkMode = () => {
        document.querySelector("body").setAttribute("data-theme", "dark");
        localStorage.setItem('theme', 'dark');
        setTheme("dark");
    }

    function lightThemeActive() {
        return theme === "light"
    }

    function darkThemeActive() {
        return theme === "dark"
    }

    useEffect(() => {
        if (theme === "light") {
            setLightMode();
        } else {
            setDarkMode();
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setLightMode, setDarkMode, lightThemeActive, darkThemeActive }}>
            {children}
        </ThemeContext.Provider>
    );
};