import React, { createContext, useState, useContext, useEffect } from 'react';
import { MdPerson } from 'react-icons/md';
import { ToastContext } from './ToastContext';
import AuthenticationModal from '../components/modals/AuthenticationModal';
import UserProfileModal from '../components/modals/UserProfileModal';
import { googleLogout } from '@react-oauth/google';
import secureLocalStorage from 'react-secure-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { showToast } = useContext(ToastContext);

  const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = secureLocalStorage.getItem('user');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  function login(userData) {
    console.log(userData.user)
    setUser(userData.user);
    secureLocalStorage.setItem('user', userData.user);
  };

  function logout() {
    setUser(null);
    googleLogout();
    secureLocalStorage.removeItem('user')
  };

  const handleUser = () => {
    if (!user) {
      setShowAuthenticationModal(true);
      return
    }
    setShowProfileModal(true);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, handleUser }}>
        {children}
        <div
          onClick={handleUser}
          className="fixed hidden lg:flex bottom-[69px] sm:bottom-5 right-[5px] sm:right-5 w-10 h-10 rounded-full bg-gray-300 dark:bg-[#2f3031] flex justify-center items-center cursor-pointer"
        >
            {user ? (
              <img src={user.picture} alt="User" className="rounded-full w-full h-full" />
            ) : (
              <MdPerson size={25} className="text-gray-500 dark:text-gray-400" />
            )}
        </div>

        {showAuthenticationModal && <AuthenticationModal  setShowAuthenticationModal={setShowAuthenticationModal} />}
        {showProfileModal && <UserProfileModal  setShowProfileModal={setShowProfileModal} />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
