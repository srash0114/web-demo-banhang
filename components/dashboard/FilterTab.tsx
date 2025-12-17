'use client';

interface FilterTabProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export default function FilterTab({ label, count, active, onClick }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-[0.3em] transition-all whitespace-nowrap border ${
        active
          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105'
          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-500'
      }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-lg text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}
