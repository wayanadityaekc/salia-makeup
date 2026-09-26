"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getMe, loginUser, registerUser, getUserToken, clearUserToken } from "@/lib/storage";

const Ctx = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getUserToken()) { setReady(true); return; }
    getMe()
      .then((u) => { if (!u) clearUserToken(); setUser(u); })
      .finally(() => setReady(true));
  }, []);

  const login = async (identifier, password) => {
    const u = await loginUser(identifier, password);
    setUser(u);
    return u;
  };
  const register = async (body) => {
    const u = await registerUser(body);
    setUser(u);
    return u;
  };
  const logout = () => {
    clearUserToken();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useUser = () => useContext(Ctx) || { user: null, ready: false };
