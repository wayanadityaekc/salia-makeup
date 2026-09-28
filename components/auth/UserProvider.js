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
    getMe()
      .then((u) => { if (!u) clearUserToken(); setUser(u); })
      .finally(() => setReady(true));
  }, []);

  const requestCode = (email) => requestLoginCode(email);
  const verifyCode = async (email, code, nama) => {
    const u = await verifyLoginCode(email, code, nama);
    setUser(u);
    return u;
  };
  const logout = () => {
    clearUserToken();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, ready, requestCode, verifyCode, logout }}>{children}</Ctx.Provider>;
}

export const useUser = () => useContext(Ctx) || { user: null, ready: false };
