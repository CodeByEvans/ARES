import { useMemo, useState } from "react";
import { useMouseGlow } from "../../hooks/Usemouseglow";

type ArchiveStatus = "stable" | "cold" | "deprecated";

interface ArchiveEntry {
  name: string;
  status: ArchiveStatus;
  nodes: number;
  lastAccess: string;
}

const archiveEntries: ArchiveEntry[] = [
  { name: "Quantum Simulation v1.4", status: "stable", nodes: 84, lastAccess: "2h ago" },
  { name: "Legacy Knowledge Graph", status: "cold", nodes: 1240, lastAccess: "Dec 12, 2023" },
  { name: "Global Trend Synthesis", status: "deprecated", nodes: 12, lastAccess: "Jan 05, 2024" },
];

const statusLabel: Record<ArchiveStatus, string> = {
  stable: "STABLE",
  cold: "COLD",
  deprecated: "DEPRECATED",
};

export default function ArchivesBucket() {
  const [filter, setFilter] = useState("");
  const handleMouseMove = useMouseGlow<HTMLDivElement>();

  const filteredEntries = useMemo(
    () =>
      archiveEntries.filter((entry) =>
        entry.name.toLowerCase().includes(filter.trim().toLowerCase()),
      ),
    [filter],
  );

  return (
    <div
      className="glass-2 rounded-3xl p-8 col-span-1 lg:col-span-12 transition-all duration-500 hover:border-white/20 overflow-hidden opacity-0 translate-y-5 animate-[card-enter_0.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards] before:absolute before:inset-0 before:rounded-3xl before:opacity-0 before:transition-opacity hover:before:opacity-100 before:pointer-events-none relative"
      style={{
        animationDelay: "0.2s",
        "--card-delay": "0.2s",
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
    >
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center glass-3 transition-transform">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 32 }}>archive</span>
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold">Archives</h3>
            <span className="font-label text-xs text-on-surface-variant/60 tracking-wider">LEGACY DATA REPOSITORY</span>
          </div>
        </div>

        <div className="relative">
          <input
            className="bg-white/5 border-none rounded-full py-2 px-6 font-label text-xs text-on-surface w-64 focus:ring-1 focus:ring-primary/50 placeholder:text-on-surface-variant/30"
            placeholder="Filter archives..."
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant/40">search</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 font-label text-sm text-secondary/60">
              <th className="pb-4 font-normal">BUCKET NAME</th>
              <th className="pb-4 font-normal">COMPLETION</th>
              <th className="pb-4 font-normal">NODES</th>
              <th className="pb-4 font-normal">LAST ACCESS</th>
              <th className="pb-4 text-right font-normal">ACTION</th>
            </tr>
          </thead>
          <tbody className="font-body text-base">
            {filteredEntries.map((entry) => (
              <tr key={entry.name} className="border-b border-white/5 hover:bg-white/5 transition-colors group last:border-none">
                <td className="py-4">{entry.name}</td>
                <td className="py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${
                    entry.status === 'stable' ? 'bg-primary/10 text-primary' :
                    entry.status === 'cold' ? 'bg-on-surface-variant/10 text-on-surface-variant' :
                    'bg-error/10 text-error'
                  }`}>
                    {statusLabel[entry.status]}
                  </span>
                </td>
                <td className="py-4">{entry.nodes.toLocaleString()} Nodes</td>
                <td className="py-4 opacity-60">{entry.lastAccess}</td>
                <td className="py-4 text-right">
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`More actions for ${entry.name}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
