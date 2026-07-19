import { useMouseGlow } from "../../hooks/Usemouseglow";
import type { ProjectFolder } from "../../types";

interface Props {
  projects: ProjectFolder[];
  loading: boolean;
}

const MAX_BAR_GB = 20;

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 0.1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectsBucket({ projects, loading }: Props) {
  const handleMouseMove = useMouseGlow<HTMLDivElement>();

  return (
    <div
      className="glass-2 rounded-3xl p-8 col-span-1 lg:col-span-8 transition-all duration-500 hover:border-primary/30 opacity-0 translate-y-5 animate-[card-enter_0.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards] before:absolute before:inset-0 before:rounded-3xl before:opacity-0 before:transition-opacity hover:before:opacity-100 before:pointer-events-none relative overflow-hidden"
      style={{
        animationDelay: "0s",
        "--card-delay": "0s",
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
    >
      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center glass-3 transition-transform">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>hub</span>
          </div>
          <div>
            <h3 className="font-display text-[32px] font-semibold">Projects</h3>
            <span className="font-label text-xs text-on-surface-variant/60 tracking-wider">
              {loading ? "LOADING..." : `${projects.length} PROJECTS`}
            </span>
          </div>
        </div>
        <button className="p-3 glass-1 rounded-full transition-all hover:glass-3" aria-label="Add project">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 font-body text-on-surface-variant/60">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-2 font-body text-on-surface-variant/40">No projects found</div>
        ) : (
          projects.map((project) => {
            const usedGb = project.total_size / (1024 * 1024 * 1024);
            const percent = Math.min((usedGb / MAX_BAR_GB) * 100, 100);
            return (
              <div className="glass-1 p-6 rounded-xl border border-white/5 cursor-pointer transition-colors hover:border-primary/20 group" key={project.name}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-body text-base font-bold">{project.name}</span>
                  <span className="material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(percent, 2)}%` }}
                  />
                </div>
                <p className="font-label text-xs text-on-surface-variant">
                  {formatSize(project.total_size)} / {MAX_BAR_GB} GB — {project.file_count} files
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
