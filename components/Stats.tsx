import { CalendarDays, Users, Code2, Trophy } from "lucide-react";

const stats = [
  { value: "50+", label: "Events Organized", icon: CalendarDays, tone: "text-emerald-500" },
  { value: "1000+", label: "Active Members", icon: Users, tone: "text-blue-500" },
  { value: "15+", label: "Technical Clubs", icon: Code2, tone: "text-violet-500" },
  { value: "30+", label: "Achievements", icon: Trophy, tone: "text-amber-500" }
];

export function Stats() {
  return (
    <div className="glass grid grid-cols-2 overflow-hidden rounded-[26px] md:grid-cols-4">
      {stats.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`flex items-center gap-3 p-5 md:p-6 ${i < 3 ? "md:border-r" : ""} border-slate-200/70`}>
            <Icon className={item.tone} size={26} />
            <div>
              <div className="text-2xl font-extrabold tracking-tight">{item.value}</div>
              <div className="text-xs font-medium text-slate-500">{item.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}