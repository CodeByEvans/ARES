import { Plus } from "lucide-react";

export default function NewSessionButton() {
  return (
    <button className="group flex items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 backdrop-blur-xl px-4 py-3 text-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.08)] transition-all duration-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] active:scale-95 mx-6 mb-8 w-[calc(100%-3rem)]">
      <Plus size={16} className="transition-transform group-hover:rotate-90" />
      <span className="text-sm font-medium tracking-wide">New Session</span>
    </button>
  );
}
