import type { LucideIcon } from "lucide-react";

export function GlassIcon({ icon: Icon, className = "" }: { icon: LucideIcon; className?: string }) {
  return (
    <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-white/75 soft-border shadow-sm ${className}`}>
      <Icon size={23} />
    </div>
  );
}