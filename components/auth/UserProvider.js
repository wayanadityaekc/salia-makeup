"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getMe, requestLoginCode, verifyLoginCode, getUserToken, clearUserToken } from "@/lib/storage";

const Ctx = createContext(null);

// Passwordless: enter email -> receive a 6-digit code -> verify. No password.
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getUserToken()) { setReady(true); return; }
    async function loadUser() {
      try {
        const currentUser = await getMe();
        if (!currentUser) clearUserToken();
        setUser(currentUser);
      } catch (e) {
        // getMe already returns null on failure; nothing else to do.
      } finally {
        setReady(true);
      }
    }
    loadUser();
  }, []);

  function requestCode(email) { return requestLoginCode(email); }
  async function verifyCode(email, code, nama) {
    const verifiedUser = await verifyLoginCode(email, code, nama);
    setUser(verifiedUser);
    return verifiedUser;
  }
  function logout() {
    clearUserToken();
    setUser(null);
  }

  return <Ctx.Provider value={{ user, ready, requestCode, verifyCode, logout }}>{children}</Ctx.Provider>;
}

export function useUser() { return useContext(Ctx) || { user: null, ready: false }; }
