import { useMemo, useState } from "react";
import { useMouseGlow } from "../../hooks/Usemouseglow";
import type { B2File } from "../../types";

interface Props {
  files: B2File[];
  folders: string[];
  fileCount: number;
  loading: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function ArchivesBucket({ files, folders, fileCount, loading, currentPath, onNavigate }: Props) {
  const [filter, setFilter] = useState("");
  const handleMouseMove = useMouseGlow<HTMLDivElement>();

  const filteredFiles = useMemo(
    () =>
      files.filter((f) =>
        f.name.toLowerCase().includes(filter.trim().toLowerCase()),
      ),
    [files, filter],
  );

  const breadcrumbs = currentPath
    ? currentPath.split("/").filter(Boolean)
    : [];

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
            <span className="font-label text-xs text-on-surface-variant/60 tracking-wider">
              {loading ? "LOADING..." : `${fileCount} FILES`}
            </span>
          </div>
        </div>

        <div className="relative">
          <input
            className="bg-white/5 border-none rounded-full py-2 px-6 font-label text-xs text-on-surface w-64 focus:ring-1 focus:ring-primary/50 placeholder:text-on-surface-variant/30"
            placeholder="Filter files..."
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant/40">search</span>
        </div>
      </div>

      {currentPath && (
        <div className="flex items-center gap-2 mb-4 font-label text-xs text-on-surface-variant/60">
          <button
            className="hover:text-primary transition-colors"
            onClick={() => onNavigate("")}
          >
            root
          </button>
          {breadcrumbs.map((crumb, i) => {
            const path = breadcrumbs.slice(0, i + 1).join("/");
            return (
              <span key={crumb} className="flex items-center gap-2">
                <span>/</span>
                <button
                  className="hover:text-primary transition-colors"
                  onClick={() => onNavigate(path)}
                >
                  {crumb}
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 font-label text-sm text-secondary/60">
              <th className="pb-4 font-normal">NAME</th>
              <th className="pb-4 font-normal">TYPE</th>
              <th className="pb-4 font-normal">SIZE</th>
              <th className="pb-4 font-normal">UPLOADED</th>
              <th className="pb-4 text-right font-normal">ACTION</th>
            </tr>
          </thead>
          <tbody className="font-body text-base">
            {!currentPath && folders.map((folder) => (
              <tr
                key={folder}
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer last:border-none"
                onClick={() => onNavigate(folder)}
              >
                <td className="py-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>folder</span>
                  {folder}
                </td>
                <td className="py-4 opacity-40">folder</td>
                <td className="py-4 opacity-40">—</td>
                <td className="py-4 opacity-40">—</td>
                <td className="py-4 text-right">
                  <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: 20 }}>chevron_right</span>
                </td>
              </tr>
            ))}
            {loading ? (
              <tr><td colSpan={5} className="py-4 opacity-40">Loading...</td></tr>
            ) : filteredFiles.length === 0 && folders.length === 0 ? (
              <tr><td colSpan={5} className="py-4 opacity-40">No files</td></tr>
            ) : (
              filteredFiles.map((file) => (
                <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group last:border-none">
                  <td className="py-4">{file.name}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-on-surface-variant/10 text-on-surface-variant">
                      {file.content_type.split("/")[0] || "unknown"}
                    </span>
                  </td>
                  <td className="py-4">{formatSize(file.size)}</td>
                  <td className="py-4 opacity-60">{formatDate(file.uploaded)}</td>
                  <td className="py-4 text-right">
                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`More actions for ${file.name}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
