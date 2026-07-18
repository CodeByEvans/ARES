import { useMouseGlow } from "../../hooks/Usemouseglow";

interface QueryGroup {
  label: string;
  icon: string;
  count: number;
}

const queryGroups: QueryGroup[] = [
  { label: "Creative Writing", icon: "terminal", count: 452 },
  { label: "Logic Structures", icon: "code", count: 231 },
  { label: "Persona Files", icon: "psychology", count: 118 },
];

export default function PromptsBucket() {
  const handleMouseMove = useMouseGlow<HTMLDivElement>();

  return (
    <div
      className="glass-2 rounded-3xl p-8 col-span-1 lg:col-span-4 transition-all duration-500 hover:border-secondary/30 opacity-0 translate-y-5 animate-[card-enter_0.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards] before:absolute before:inset-0 before:rounded-3xl before:opacity-0 before:transition-opacity hover:before:opacity-100 before:pointer-events-none relative overflow-hidden"
      style={{
        animationDelay: "0.1s",
        "--card-delay": "0.1s",
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center glass-3 transition-transform">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 32 }}>auto_awesome</span>
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold">Prompts</h3>
          <span className="font-label text-xs text-on-surface-variant/60 tracking-wider">1.2K SAVED QUERY</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {queryGroups.map((group) => (
          <div className="flex items-center justify-between p-4 glass-1 rounded-xl border border-white/5" key={group.label}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>{group.icon}</span>
              <span className="font-label text-sm">{group.label}</span>
            </div>
            <span className="font-label text-xs opacity-40">{group.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
