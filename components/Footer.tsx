import Link from "next/link";
import { Github, Instagram, Linkedin, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="container pb-8 pt-16">
      <div className="glass rounded-[28px] p-7 md:p-9">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-4">
  {/* Technical Council Logo */}
  <img
    src="/images/logo.png"
    alt="Technical Council"
    className="h-10 w-10 object-contain"
  />

  {/* Separator */}
  <div className="h-8 w-px bg-slate-300/70" />

  {/* College Logo */}
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
  <div className="h-8 w-px bg-slate-300/70" />

  {/* University Logo */}
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
      <p className="max-w-sm text-sm leading-6 text-slate-500">Empowering future engineers through innovation, collaboration and technical excellence.</p>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold">Quick Links</h3>
            <div className="grid gap-2 text-sm text-slate-500">
              {["Home","Events","Team","Gallery","Contact"].map(x => <Link key={x} href={x === "Home" ? "/" : `/${x.toLowerCase()}`}>{x}</Link>)}
            </div>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold">Resources</h3>
            <div className="grid gap-2 text-sm text-slate-500">
              {/* <a href="#">Achievements</a> */}
              <a href="#">Downloads</a><a href="#">Notices</a><a href="#">FAQs</a>
            </div>
          </div>
          <div>
  <div>
  <h3 className="mb-4 font-extrabold">Follow Us</h3>

  <div className="flex gap-2">
    {/* Instagram */}
    <a
      href="https://www.instagram.com/technicalcouncil_recabn/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="footer-social-icon grid h-10 w-10 place-items-center rounded-full bg-white soft-border transition hover:-translate-y-1"
    >
      <Instagram size={17} />
    </a>

    {/* LinkedIn */}
    <a
      href="YOUR_LINKEDIN_URL"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LinkedIn"
      className="footer-social-icon grid h-10 w-10 place-items-center rounded-full bg-white soft-border transition hover:-translate-y-1"
    >
      <Linkedin size={17} />
    </a>

    {/* GitHub */}
    <a
      href="YOUR_GITHUB_URL"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub"
      className="footer-social-icon grid h-10 w-10 place-items-center rounded-full bg-white soft-border transition hover:-translate-y-1"
    >
      <Github size={17} />
    </a>

    {/* YouTube */}
    <a
      href="https://www.youtube.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="YouTube"
      className="footer-social-icon grid h-10 w-10 place-items-center rounded-full bg-white soft-border transition hover:-translate-y-1"
    >
      <Youtube size={17} />
    </a>
  </div>
</div>
</div>
        </div>
        <div className="mt-8 border-t border-slate-200/70 pt-5 text-center text-xs text-slate-400">
          © 2026 Technical Council, REC Ambedkar Nagar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}