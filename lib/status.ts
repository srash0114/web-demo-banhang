export function getStatusStyles(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-700';
    case 'SHIPPING':
      return 'bg-blue-100 text-blue-700';
    case 'DELIVERED':
      return 'bg-teal-100 text-teal-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}

export const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'COMPLETED', label: 'Đã thanh toán' },
  { value: 'SHIPPING', label: 'Đang giao hàng' },
  { value: 'DELIVERED', label: 'Đã giao hàng' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

// Get allowed status transitions based on current status
export function getAllowedStatuses(currentStatus: string) {
  switch (currentStatus) {
    case 'PENDING':
      // Chờ thanh toán → có thể chuyển sang Đã thanh toán hoặc Hủy
      return ['PENDING', 'COMPLETED', 'CANCELLED'];
    case 'COMPLETED':
      // Đã thanh toán → có thể chuyển sang Đang giao hoặc Hủy
      return ['COMPLETED', 'SHIPPING', 'CANCELLED'];
    case 'SHIPPING':
      // Đang giao → có thể chuyển sang Đã giao hoặc quay lại Đã thanh toán
      return ['SHIPPING', 'DELIVERED', 'COMPLETED'];
    case 'DELIVERED':
      // Đã giao → không thể thay đổi (trạng thái cuối)
      return ['DELIVERED'];
    case 'CANCELLED':
      // Đã hủy → không thể thay đổi (trạng thái cuối)
      return ['CANCELLED'];
    default:
      return ORDER_STATUSES.map(s => s.value);
  }
}
