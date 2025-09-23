import React, { useContext, useState } from "react";
import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

import { ToastContext } from "../../context/ToastContext";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import moment from 'moment';

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

export default function UserProfileModal(props) {
    const { t } = useTranslation();

    const { showToast } = useContext(ToastContext);
    const { theme } = useContext(ThemeContext);
    const { user, logout } = useContext(AuthContext);

    const [isLoading, setLoading] = useState(false);

    const [openAlert, setOpen] = useState(true);
    const handleClose = () => {
        setOpen(false);
        props.setShowProfileModal(false);
    };

    function handleLogout() {
        handleClose();
        logout();
    };

    const createdAt = moment(user.created_at);
    const timeAgo = createdAt.fromNow();

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
                    <div className="flex flex-col h-full sm:rounded-md bg-gray-50 dark:bg-neutral-800 sm:py-7 px-4">
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

                        <div className="flex-grow flex flex-col justify-center items-center">
                            <div className="flex justify-center">
                                <img src={user.picture} className="rounded-full w-14 h-14"/>
                            </div>
                            <h1 className="font-bold text-center text-lg sm:text-2xl text-gray-900 dark:text-gray-300">
                                {user.full_name && user.full_name !== "" ? user.full_name : user.name}
                            </h1>
                            <p className="text-center text-xs sm:text-sm text-gray-400 dark:text-gray-600 font-medium">
                                {user.email}
                            </p>
                            <p className="text-center text-sm pt-4 pb-1 text-gray-700 dark:text-gray-600">
                                Perfil criado {timeAgo} atrás.
                            </p>
                        </div>

                        <div className="mt-auto mb-4 sm:mb-0">
                            <button
                                className="flex w-full justify-center items-center py-1.5 px-2.5 text-sm gap-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 hover:dark:bg-gray-700 dark:text-gray-400 rounded-md"
                                onClick={() => handleLogout()}
                            >
                                <LogoutOutlinedIcon style={{fontSize: '1.5rem'}}/>
                                Sair    
                            </button>
                        </div>
                    </div>
                </Box>
            </>
        </Modal>
    );
}
