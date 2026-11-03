'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser, requestLoginCode, verifyLoginCode, getUserToken, clearUserToken } from '@/lib/storage';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getUserToken()) {
      setReady(true);
      return;
    }
    async function loadUser() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!currentUser) clearUserToken();
        setUser(currentUser);
      } catch (e) {
      } finally {
        setReady(true);
      }
    }
    loadUser();
  }, []);

  function requestCode(email) {
    return requestLoginCode(email);
  }
  async function verifyCode(email, code, nama) {
    const verifiedUser = await verifyLoginCode(email, code, nama);
    setUser(verifiedUser);
    return verifiedUser;
  }
  function logout() {
    clearUserToken();
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, ready, requestCode, verifyCode, logout }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext) || { user: null, ready: false };
}
