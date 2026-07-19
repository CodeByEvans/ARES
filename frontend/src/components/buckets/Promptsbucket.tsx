import { useMouseGlow } from "../../hooks/Usemouseglow";
import type { B2File } from "../../types";

interface Props {
  files: B2File[];
  totalSize: number;
  fileCount: number;
  loading: boolean;
}

function groupByType(files: B2File[]) {
  const groups: Record<string, { icon: string; count: number }> = {};
  for (const f of files) {
    const category = f.content_type.split("/")[0] || "unknown";
    if (!groups[category]) {
      groups[category] = { icon: iconForCategory(category), count: 0 };
    }
    groups[category].count++;
  }
  return Object.entries(groups).map(([label, data]) => ({
    label,
    icon: data.icon,
    count: data.count,
  }));
}

function iconForCategory(category: string): string {
  switch (category) {
    case "text": return "terminal";
    case "image": return "image";
    case "audio": return "headphones";
    case "video": return "play_circle";
    case "application": return "code";
    default: return "draft";
  }
}

export default function PromptsBucket({ files, totalSize: _totalSize, fileCount, loading }: Props) {
  const handleMouseMove = useMouseGlow<HTMLDivElement>();
  const groups = groupByType(files);

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
          <span className="font-label text-xs text-on-surface-variant/60 tracking-wider">
            {loading ? "LOADING..." : `${fileCount} FILES`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <span className="font-label text-sm text-on-surface-variant/60">Loading...</span>
        ) : groups.length === 0 ? (
          <span className="font-label text-sm text-on-surface-variant/40">No files in prompts/</span>
        ) : (
          groups.map((group) => (
            <div className="flex items-center justify-between p-4 glass-1 rounded-xl border border-white/5" key={group.label}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>{group.icon}</span>
                <span className="font-label text-sm capitalize">{group.label}</span>
              </div>
              <span className="font-label text-xs opacity-40">{group.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
