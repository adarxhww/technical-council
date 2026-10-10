import Link from "next/link";

import { Github, Instagram, Linkedin} from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer-section">
      <div className="container pb-8 pt-16">
        <div
          className="
            site-footer
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-slate-200
            bg-white
            p-7
            shadow-[0_20px_60px_rgba(36,63,120,0.08)]
            md:p-9
            dark:border-white/10
            dark:bg-[#171717]
            dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)]
          "
        >
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* =====================================================
                BRAND
            ===================================================== */}
            <div>
              <div className="mb-3 flex items-center gap-4">
                {/* Technical Council Logo */}
                <img
                  src="/images/logo.png"
                  alt="Technical Council"
                  className="h-10 w-10 object-contain"
                />

                {/* Separator */}
                <div className="h-8 w-px bg-slate-300/70 dark:bg-white/20" />

                {/* REC Logo */}
                <a
                  href="https://recabn.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/images/rec-logo.png"
                    alt="Rajkiya Engineering College"
                    className="h-12 w-12 object-contain"
                  />
                </a>

                {/* Separator */}
                <div className="h-8 w-px bg-slate-300/70 dark:bg-white/20" />

                {/* AKTU Logo */}
                <a
                  href="https://aktu.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/images/aktu-logo.png"
                    alt="AKTU"
                    className="h-10 w-10 object-contain"
                  />
                </a>
              </div>

              <p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Empowering future engineers through innovation, collaboration
                and technical excellence.
              </p>
            </div>

            {/* =====================================================
                QUICK LINKS
            ===================================================== */}
            <div>
              <h3 className="mb-4 font-extrabold text-slate-900 dark:text-white">
                Quick Links
              </h3>

              <div className="grid gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Link
                  href="/"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  Home
                </Link>

                <Link
                  href="/events"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  Events
                </Link>

                <Link
                  href="/team"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  Team
                </Link>

                <Link
                  href="/gallery"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  Gallery
                </Link>

                <Link
                  href="/contact"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* =====================================================
                RESOURCES
            ===================================================== */}
            <div>
              <h3 className="mb-4 font-extrabold text-slate-900 dark:text-white">
                Resources
              </h3>

              <div className="grid gap-2 text-sm text-slate-500 dark:text-slate-400">
                <a
                  href="#"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  Downloads
                </a>

                <a
                  href="#"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  Notices
                </a>

                <a
                  href="#"
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  FAQs
                </a>
              </div>
            </div>

            {/* =====================================================
                FOLLOW US
            ===================================================== */}
            <div>
              <h3 className="mb-4 font-extrabold text-slate-900 dark:text-white">
                Follow Us
              </h3>

              <div className="flex gap-2">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/technicalcouncil_recabn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="footer-social-icon grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 transition hover:-translate-y-1 dark:border-white/10 dark:bg-[#202020]"
                >
                  <Instagram size={17} />
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/technicalcouncil-recabn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="footer-social-icon grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 transition hover:-translate-y-1 dark:border-white/10 dark:bg-[#202020]"
                >
                  <Linkedin size={17} />
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com/Technical-Council"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="footer-social-icon grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 transition hover:-translate-y-1 dark:border-white/10 dark:bg-[#202020]"
                >
                  <Github size={17} />
                </a>
              </div>
            </div>
          </div>

          {/* =====================================================
              COPYRIGHT
          ===================================================== */}
          <div className="mt-8 border-t border-slate-200/70 pt-5 text-center text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">
            © 2026 Technical Council, REC Ambedkar Nagar. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}