import { ArrowRight, Bot, BrainCircuit, Code2, Cpu, ShieldCheck, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Coding: Code2,
  Robotics: Bot,
  "AI/ML": BrainCircuit,
  IoT: Wifi,
  "Cyber Security": ShieldCheck,
  Electronics: Cpu
};

const toneMap: Record<string, string> = {
  Coding: "text-emerald-500 bg-emerald-50",
  Robotics: "text-blue-500 bg-blue-50",
  "AI/ML": "text-violet-500 bg-violet-50",
  IoT: "text-amber-500 bg-amber-50",
  "Cyber Security": "text-rose-500 bg-rose-50",
  Electronics: "text-emerald-500 bg-emerald-50"
};

export function ClubCard({ name, description, href = "/clubs" }: { name: string; description: string; href?: string }) {
  const Icon = iconMap[name] ?? Code2;
  return (
    <a href={href} className="glass card-hover soft-border block rounded-[24px] p-5">
      <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${toneMap[name] ?? "bg-slate-50 text-slate-600"}`}>
        <Icon size={25} />
      </div>
      <h3 className="text-lg font-extrabold">{name} Club</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-700">
        Explore <ArrowRight size={16} />
      </div>
    </a>
  );
}