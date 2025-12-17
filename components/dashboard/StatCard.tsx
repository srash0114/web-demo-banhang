'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'orange' | 'emerald';
  dark?: boolean;
}

const COLORS: Record<StatCardProps['color'], string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

export default function StatCard({ label, value, icon, color, dark = false }: StatCardProps) {
  if (dark) {
    return (
      <div className="bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 p-8 rounded-[32px] shadow-xl text-white">
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-semibold uppercase opacity-70 tracking-[0.35em]">{label}</span>
          <span className="text-2xl">{icon}</span>
        </div>
        <p className="text-4xl font-semibold text-white/90 tracking-tight">{value}</p>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-lg hover:border-indigo-100 bg-white">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold uppercase text-slate-500 tracking-[0.35em]">{label}</span>
        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${COLORS[color]}`}>{icon}</span>
      </div>
      <p className="text-4xl font-extrabold text-slate-700 tracking-tight">{value}</p>
    </div>
  );
}
