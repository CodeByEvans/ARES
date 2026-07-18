import TopBar from "../components/TopBar";
import ProjectsBucket from "../components/buckets/Projectsbucket";
import PromptsBucket from "../components/buckets/Promptsbucket";
import ArchivesBucket from "../components/buckets/Archivesbucket";
import FloatingActionButton from "../components/buckets/Floatingactionbutton";

export default function BucketsPage() {
  return (
    <>
      <TopBar />

      <section className="flex-1 w-full px-6 md:px-10 py-10 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full blur-[100px] -z-10 pointer-events-none bg-primary opacity-20" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] -z-10 pointer-events-none bg-secondary opacity-10" />

        <div className="mb-12">
          <h2 className="font-display text-5xl font-bold text-white mb-2">Storage Buckets</h2>
          <p className="font-body text-lg text-secondary/80">
            Organize your computational history and generated intelligence across secure, glass-morphic storage nodes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <ProjectsBucket />
          <PromptsBucket />
          <ArchivesBucket />
        </div>
      </section>

      <FloatingActionButton />
    </>
  );
}
