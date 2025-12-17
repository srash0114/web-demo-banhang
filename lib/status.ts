export function getStatusStyles(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}
