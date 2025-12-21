'use client';

import { Order } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import { getStatusStyles, ORDER_STATUSES, getAllowedStatuses } from '@/lib/status';
import { useState, useMemo } from 'react';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus?: (orderId: number, newStatus: string) => Promise<void>;
  accessToken?: string;
}

export default function OrderDetailModal({ order, onClose, onUpdateStatus, accessToken }: OrderDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);

  // Lấy danh sách trạng thái được phép dựa trên trạng thái hiện tại
  const allowedStatusValues = useMemo(() => getAllowedStatuses(order.status), [order.status]);
  const availableStatuses = useMemo(
    () => ORDER_STATUSES.filter(s => allowedStatusValues.includes(s.value)),
    [allowedStatusValues]
  );

  const handleUpdateStatus = async () => {
    if (!onUpdateStatus || selectedStatus === order.status) return;

    setUpdating(true);
    try {
      await onUpdateStatus(order.id, selectedStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl border border-white">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/80">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">Chi tiết đơn #{order.id}</h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.4em]">
              Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-indigo-50/50 p-6 rounded-[28px] mb-8 border border-indigo-100/50">
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-[0.3em] mb-2">Thông tin nhận hàng</p>
            <p className="font-semibold text-slate-700">{order.user?.name ?? 'Ẩn danh'}</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">🏠 {order.shippingAddress ?? 'Chưa cập nhật'}</p>
          </div>

          <h4 className="font-semibold text-slate-500 text-[10px] uppercase tracking-[0.4em] mb-4">Sản phẩm trong đơn</h4>

          <div className="space-y-4">
            {(order.items ?? []).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-300 uppercase overflow-hidden">
                    {item.product?.image ? (
                      <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name ?? 'Product image'} />
                    ) : (
                      'ẢNH'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 mb-2">{item.product?.name ?? 'Sản phẩm không tên'}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.size && (
                        <span className="bg-indigo-600/90 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase shadow-sm">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="bg-slate-700 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase shadow-sm">
                          Màu: {item.color}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 px-1 py-0.5">SL: x{item.quantity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-700 text-lg">{formatCurrency(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold opacity-80 uppercase tracking-[0.35em]">Tổng thanh toán</p>
              <p className="text-3xl font-extrabold text-white leading-none">{formatCurrency(order.totalPrice)}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase ${getStatusStyles(order.status)}`}>
              {order.status}
            </div>
          </div>

          {onUpdateStatus && (
            <div className="flex gap-3 items-center">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updating || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {availableStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || selectedStatus === order.status}
                className="px-6 py-2 rounded-xl text-sm font-semibold bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
