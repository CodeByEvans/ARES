export default function FloatingActionButton() {
  return (
    <button className="hidden md:flex fixed bottom-10 right-10 z-50 w-16 h-16 bg-primary text-on-primary rounded-full items-center justify-center shadow-[0_0_40px_rgba(184,195,255,0.4)] transition-transform duration-300 active:scale-90" aria-label="Create new bucket">
      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 32 }}>add_circle</span>
    </button>
  );
}
