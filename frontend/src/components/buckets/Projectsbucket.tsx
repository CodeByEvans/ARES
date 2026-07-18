import { useMouseGlow } from "../../hooks/Usemouseglow";

interface Project {
  name: string;
  usedGb: number;
  totalGb: number;
  accent: "primary" | "secondary";
}

const projects: Project[] = [
  { name: "Neural Engine Alpha", usedGb: 12.4, totalGb: 20, accent: "primary" },
  { name: "Cybernetic Vision", usedGb: 4.1, totalGb: 15, accent: "secondary" },
];

export default function ProjectsBucket() {
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
            <span className="font-label text-xs text-on-surface-variant/60 tracking-wider">24 ACTIVE CONTAINERS</span>
          </div>
        </div>
        <button className="p-3 glass-1 rounded-full transition-all hover:glass-3" aria-label="Add project">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div className="glass-1 p-6 rounded-xl border border-white/5 cursor-pointer transition-colors hover:border-primary/20 group" key={project.name}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-body text-base font-bold">{project.name}</span>
              <span className="material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${project.accent === 'primary' ? 'bg-primary' : 'bg-secondary'}`}
                style={{ width: `${(project.usedGb / project.totalGb) * 100}%` }}
              />
            </div>
            <p className="font-label text-xs text-on-surface-variant">
              {project.usedGb} GB / {project.totalGb} GB USED
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
