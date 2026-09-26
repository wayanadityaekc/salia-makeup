"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { site } from "@/lib/config";
import { useUser } from "@/components/auth/UserProvider";
import AuthModal from "@/components/auth/AuthModal";

const nav = [
  { href: "/", label: "Beranda" },
  { href: "/layanan", label: "Make Up" },
  { href: "/nail-art", label: "Nail Art" },
  { href: "/galeri", label: "Galeri" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition ${
        solid
          ? "border-rose-line bg-white/90 backdrop-blur"
          : "border-transparent bg-white"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-rose">
          {site.brand}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm transition hover:text-rose ${
                pathname === n.href ? "font-semibold text-rose" : "text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <User size={16} className="text-rose" /> {user.nama?.split(" ")[0]}
              </span>
              <button onClick={logout} className="inline-flex items-center gap-1 text-sm text-muted hover:text-rose" aria-label="Keluar">
                <LogOut size={15} /> Keluar
              </button>
            </div>
          ) : (
            <button onClick={() => setAuth(true)} className="btn-primary">
              Login
            </button>
          )}
        </nav>

        <button
          className="md:hidden text-rose"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-rose-line bg-white md:hidden">
          <div className="container-x flex flex-col py-3">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`py-3 text-sm ${
                  pathname === n.href ? "font-semibold text-rose" : "text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
            {user ? (
              <div className="mt-2 flex items-center justify-between border-t border-rose-line pt-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                  <User size={16} className="text-rose" /> {user.nama}
                </span>
                <button onClick={logout} className="inline-flex items-center gap-1 text-sm text-muted hover:text-rose">
                  <LogOut size={15} /> Keluar
                </button>
              </div>
            ) : (
              <button onClick={() => { setOpen(false); setAuth(true); }} className="btn-primary mt-2">
                Login
              </button>
            )}
          </div>
        </nav>
      )}

      {auth && <AuthModal onClose={() => setAuth(false)} />}
    </header>
  );
}
