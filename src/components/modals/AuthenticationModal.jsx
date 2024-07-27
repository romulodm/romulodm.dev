import React, { useContext, useState } from "react";
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

import CloseIcon from '@mui/icons-material/Close';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { ToastContext } from "../../context/ToastContext";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";

import { googleAuth } from "../../data/axios/auth";
import { CircularProgress } from "@mui/material";

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
};

const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    backdropFilter: 'blur(3px)',
};

const modalContentStyle = {
    position: 'relative',
    zIndex: 1000,
    backdropFilter: 'none', 
};

export default function AuthenticationModal(props) {
    const { t } = useTranslation();

    const { showToast } = useContext(ToastContext);
    const { theme } = useContext(ThemeContext);
    const { login } = useContext(AuthContext);


    const [isLoading, setLoading] = useState(false);

    const [openAlert, setOpen] = useState(true);
    const handleClose = () => {
        setOpen(false);
        props.setShowAuthenticationModal(false);
    };

    function handleGoogleLogin(content) {
        setLoading(true);

        console.log(content)

        googleAuth(content)
        .then(response => {
            if (response.status === 200) { 
                login(response.data)
                setLoading(false);
                showToast("Autenticado com sucesso!", "success")

                handleClose();
                return
            }
            else{
                showToast("Algo deu erro ao fazer o login :(", "error")
                setLoading(false);
                return
            }
        })
        .catch(error => {
            showToast("Ocorreu um erro no nosso servidor ao fazer o login. Tente novamente mais tarde.", "error")
            setLoading(false);
            return
        });
    }

    

    return (
        <Modal
            open={openAlert}
            onClose={handleClose}
        >
            <>
                <div style={backdropStyle} onClick={handleClose}></div>
                <Box 
                    sx={modalStyle} 
                    style={modalContentStyle}
                    className="w-full h-full sm:h-fit sm:w-96"
                >
                    <div className="flex flex-col h-full sm:rounded-md bg-gray-50 dark:bg-gray-950 sm:py-7 px-4">
                        <div className="relative sm:hidden py-4">
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    className="text-gray-800 dark:text-gray-50 hover:bg-gray-300 hover:dark:bg-gray-800 hover:text-gray-950 hover:dark:text-gray-300 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                                    onClick={handleClose}
                                >
                                    <CloseIcon/>
                                </button>
                            </div>
                        </div>

                        <div className="h-full w-full flex flex-col justify-center">
                            <form className="flex flex-col justify-center items-center">
                                
                                <img className="w-10 h-10" src="./icon.svg"></img>            
                                
                                <p className="text-dark dark:text-white mb-3 font-medium mt-3 text-sm sm:text-md">{t('auth.title')}</p>
                                {!isLoading ? (
                                    <GoogleLogin 
                                        onSuccess={credentialResponse => {
                                            const decoded = jwtDecode(credentialResponse?.credential);
                                            handleGoogleLogin(decoded);
                                        }}
                                        onError={() => {
                                            showToast("Ocorreu um erro ao se autenticar.", "error")
                                        }}
                                        darkThemeActive
                                        theme={`${theme == "dark" ? 'filled_black' : ''}`}
                                    />

                                ) : (
                                    <CircularProgress size={25} color="primary"/>
                                )}
                            </form>

                        </div>
                    </div>
                </Box>
            </>
        </Modal>
    );
}
