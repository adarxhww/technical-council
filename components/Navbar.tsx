"use client";

import Link from "next/link";

import {
  Moon,
  Sun,
  ArrowUpRight,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import JoinModal from "@/components/JoinModal";

const links = [
  ["Home", "/"],
  ["Events", "/events"],
  ["Team", "/team"],
  ["Gallery", "/gallery"],
  ["Contact", "/contact"],
  // ["Clubs", "/clubs"],
];

export function Navbar() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;

    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-3 z-50 px-3">
        <nav
          className="
            nav-glass
            mx-auto
            flex
            max-w-[1180px]
            items-center
            justify-between
            rounded-[24px]
            px-3
            py-2.5
            md:px-6
            md:py-3
          "
        >
          {/* Logo */}
          <Link
            href="/"
            className="
              flex
              min-w-0
              shrink
              items-center
              gap-2
              md:gap-3
            "
          >
            <img
              src="/images/logo.png"
              alt="Technical Council"
              className="
                h-10
                w-10
                shrink-0
                object-contain
                md:h-11
                md:w-11
              "
            />

            <div className="min-w-0 leading-tight">
              <div
                className="
                  whitespace-nowrap
                  text-[15px]
                  font-extrabold
                  tracking-tight
                  text-slate-950
                  dark:text-white
                  md:text-base
                "
              >
                TECHNICAL COUNCIL
              </div>

              <div
                className="
                  whitespace-nowrap
                  text-[9px]
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                  md:text-xs
                "
              >
                REC AMBEDKAR NAGAR
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map(([label, href]) => {
              const active = isActive(href);

              return (
                <Link
                  key={label}
                  href={href}
                  className={`
                    rounded-full
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    transition-all
                    duration-300
                    ${
                      active
                        ? `
                          bg-gradient-to-r
                          from-blue-500
                          to-emerald-400
                          text-white
                          shadow-[0_8px_22px_rgba(79,114,255,0.20)]
                        `
                        : `
                          text-slate-950
                          hover:bg-slate-100/80
                          hover:text-slate-950
                          dark:text-slate-200
                          dark:hover:bg-white/10
                          dark:hover:text-white
                        `
                    }
                  `}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Join Us */}
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="
                btn-primary
                flex
                items-center
                gap-2
                rounded-full
                px-5
                py-2.5
                text-sm
                font-bold
              "
            >
              Join Us
              <ArrowUpRight size={16} />
            </button>

            {/* Admin */}
            <Link
              href="/admin"
              className="
                btn-primary
                flex
                items-center
                gap-2
                rounded-full
                px-5
                py-2.5
                text-sm
                font-bold
              "
            >
              <ShieldCheck size={16} />
              Admin
            </Link>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="
                grid
                h-11
                w-11
                place-items-center
                rounded-full
                bg-white/80
                soft-border
                transition
                hover:scale-105
                dark:bg-white/10
              "
            >
              {darkMode ? (
                <Sun
                  size={18}
                  className="text-yellow-300"
                />
              ) : (
                <Moon
                  size={18}
                  className="text-slate-700"
                />
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Join Us */}
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="
                btn-primary
                flex
                shrink-0
                items-center
                gap-1
                whitespace-nowrap
                rounded-full
                px-3
                py-2
                text-[11px]
                font-bold
              "
            >
              Join Us
              <ArrowUpRight size={13} />
            </button>

            {/* Menu */}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="
                grid
                h-10
                w-10
                shrink-0
                place-items-center
                rounded-full
                bg-white
                soft-border
                dark:bg-white/10
              "
              aria-label="Toggle navigation"
            >
              {open ? (
                <X size={19} />
              ) : (
                <Menu size={19} />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {open && (
          <div
            className="
              glass
              mx-auto
              mt-2
              max-w-[1180px]
              rounded-[22px]
              p-3
              md:hidden
            "
          >
            {/* Main Links */}
            {links.map(([label, href]) => {
              const active = isActive(href);

              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`
                    mb-1
                    block
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    transition-all
                    duration-300
                    ${
                      active
                        ? `
                          bg-gradient-to-r
                          from-blue-500
                          to-emerald-400
                          text-white
                          shadow-[0_8px_22px_rgba(79,114,255,0.18)]
                        `
                        : `
                          text-slate-950
                          hover:bg-slate-100
                          dark:text-slate-200
                          dark:hover:bg-white/10
                        `
                    }
                  `}
                >
                  {label}
                </Link>
              );
            })}

            {/* Admin */}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="
                btn-primary
                mb-1
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                px-4
                py-3
                font-bold
              "
            >
              <ShieldCheck size={17} />
              Admin
            </Link>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="
                mt-2
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                font-semibold
                text-slate-950
                dark:border-white/10
                dark:bg-white/10
                dark:text-white
              "
            >
              {darkMode ? (
                <>
                  <Sun
                    size={18}
                    className="text-yellow-300"
                  />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon size={18} />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Join Modal */}
      <JoinModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
      />
    </>
  );
}