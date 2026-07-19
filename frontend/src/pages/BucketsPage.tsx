import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import ProjectsBucket from "../components/buckets/Projectsbucket";
import PromptsBucket from "../components/buckets/Promptsbucket";
import ArchivesBucket from "../components/buckets/Archivesbucket";
import FloatingActionButton from "../components/buckets/Floatingactionbutton";
import { fetchBuckets, fetchBucketFiles } from "../services/bucketService";
import type { BucketsData, ArchivesData } from "../types";

const EMPTY_ARCHIVES: ArchivesData = { files: [], folders: [], file_count: 0 };

export default function BucketsPage() {
  const [data, setData] = useState<BucketsData | null>(null);
  const [archives, setArchives] = useState<ArchivesData>(EMPTY_ARCHIVES);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBuckets()
      .then((d) => { setData(d); setError(null); })
      .catch((e) => { setError(e.message); setData(null); })
      .finally(() => setLoading(false));
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setArchivesLoading(true);
    fetchBucketFiles(path)
      .then(setArchives)
      .catch(() => setArchives(EMPTY_ARCHIVES))
      .finally(() => setArchivesLoading(false));
  };

  const archivesDisplay = currentPath
    ? archives
    : (data?.archives ?? EMPTY_ARCHIVES);

  return (
    <>
      <TopBar />

      <section className="flex-1 w-full px-6 md:px-10 py-10 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full blur-[100px] -z-10 pointer-events-none bg-primary opacity-20" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] -z-10 pointer-events-none bg-secondary opacity-10" />

        <div className="mb-12">
          <h2 className="font-display text-5xl font-bold text-white mb-2">Storage Buckets</h2>
          <p className="font-body text-lg text-secondary/80">
            Backblaze B2 — ares-storage
          </p>
          {error && (
            <p className="font-label text-sm text-error mt-2">
              Failed to load bucket data: {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <ProjectsBucket
            projects={data?.projects ?? []}
            loading={loading}
          />
          <PromptsBucket
            files={data?.prompts?.files ?? []}
            totalSize={data?.prompts?.total_size ?? 0}
            fileCount={data?.prompts?.file_count ?? 0}
            loading={loading}
          />
          <ArchivesBucket
            files={archivesDisplay.files}
            folders={currentPath ? [] : (archivesDisplay.folders ?? [])}
            fileCount={archivesDisplay.file_count}
            loading={currentPath ? archivesLoading : loading}
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        </div>
      </section>

      <FloatingActionButton />
    </>
  );
}
