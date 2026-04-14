import React, { createContext, useEffect, useState } from 'react';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toastTheme, setToastTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (!toastTheme) {
            setToastTheme("colored");
        };
    }, [toastTheme]);

    const changeToastTheme = (theme) => {
        setToastTheme(theme);
    };

    const showToast = (message, type = null, colored = false) => {
        const options = {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: colored ? "colored" : toastTheme,
            transition: Bounce,
            className: toastTheme === "light" ? 'bg-gray-200' : null,
        };

        if (!type) {
            toast(message, options);
        } else {
            toast[type](message, options);
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, changeToastTheme }}>
            {children}
            <ToastContainer
                position="bottom-left"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={toastTheme}
            />
        </ToastContext.Provider>
    );
};
