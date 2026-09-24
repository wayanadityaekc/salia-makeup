"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/lib/config";

const nav = [
  { href: "/", label: "Beranda" },
  { href: "/layanan", label: "Make Up" },
  { href: "/nail-art", label: "Nail Art" },
  { href: "/galeri", label: "Galeri" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

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
          <Link href="/booking" className="btn-primary">
            Booking
          </Link>
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
            <Link href="/booking" className="btn-primary mt-2">
              Booking
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
