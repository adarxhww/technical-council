import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ title, link, href = "#" }: { title: string; link?: string; href?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <div className="mb-2 h-1 w-10 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500" />
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
      </div>
      {link && (
        <Link href={href} className="flex items-center gap-1 text-sm font-bold text-blue-600">
          {link} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}