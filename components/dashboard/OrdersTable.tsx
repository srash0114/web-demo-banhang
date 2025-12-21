'use client';

import { Order } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import { getStatusStyles, ORDER_STATUSES, getAllowedStatuses } from '@/lib/status';
import { useState } from 'react';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus?: (orderId: number, newStatus: string) => Promise<void>;
  accessToken?: string;
}

export default function OrdersTable({ orders, loading, onSelectOrder, onUpdateStatus, accessToken }: OrdersTableProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!onUpdateStatus) return;
    
    setUpdatingOrderId(orderId);
    try {
      await onUpdateStatus(orderId, newStatus);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
      {loading && (
        <div className="px-8 py-4 flex items-center gap-3 text-sm font-semibold text-indigo-600 bg-indigo-50/60 border-b border-indigo-100">
          <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Đang tải thống kê...
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5 text-slate-500">Mã đơn</th>
              <th className="px-8 py-5 text-slate-500">Thông tin khách hàng / Địa chỉ</th>
              <th className="px-8 py-5 text-right text-slate-500">Tổng thanh toán</th>
              <th className="px-8 py-5 text-center text-slate-500">Trạng thái</th>
              <th className="px-8 py-5 text-center text-slate-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-10 text-center text-sm font-semibold text-slate-400">
                  Chưa có đơn hàng nào phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6 font-semibold text-indigo-600">#{order.id}</td>
                  <td className="px-8 py-6">
                    <div className="font-semibold text-slate-700">{order.user?.name ?? 'Ẩn danh'}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <span className="text-red-400 text-base">📍</span>
                      {order.shippingAddress ?? 'Chưa cập nhật'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right space-y-1">
                    <div className="font-semibold text-slate-700">{formatCurrency(order.totalPrice)}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {onUpdateStatus ? (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                        className={`text-[9px] font-semibold uppercase px-3 py-1.5 rounded-md border-0 cursor-pointer disabled:cursor-not-allowed ${getStatusStyles(order.status)}`}
                      >
                        {ORDER_STATUSES.filter(s => getAllowedStatuses(order.status).includes(s.value)).map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block text-[9px] font-semibold uppercase px-2 py-0.5 rounded-md ${getStatusStyles(order.status)}`}>
                        {order.status}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-semibold hover:bg-indigo-500 transition-all shadow-md"
                    >
                      XEM CHI TIẾT
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
