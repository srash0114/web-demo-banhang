'use client';

import React, { useMemo, useState } from 'react';
import { Order, OrderStats } from '@/types/order';
import { formatCurrency, resolveMessage, getNgrokHeaders } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/constants';
import StatCard from './StatCard';
import FilterTab from './FilterTab';
import OrdersTable from './OrdersTable';
import OrderDetailModal from './OrderDetailModal';
import CategoryManagement from './CategoryManagement';
import SingleProductForm from './SingleProductForm';
import ProductManagement from './ProductManagement';

interface DashboardViewProps {
  stats: OrderStats | null;
  statsLoading: boolean;
  statsError: string | null;
  onRefresh: () => void;
  onLogout: () => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  accessToken: string;
}

export default function DashboardView({
  stats,
  statsLoading,
  statsError,
  onRefresh,
  onLogout,
  filterStatus,
  setFilterStatus,
  selectedOrder,
  onSelectOrder,
  accessToken,
}: DashboardViewProps) {
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getNgrokHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const messageText = resolveMessage(payload, 'Không thể cập nhật trạng thái đơn hàng');
        throw new Error(messageText);
      }

      setUpdateSuccess(`Đã cập nhật trạng thái đơn hàng #${orderId} thành công`);
      
      // Làm mới dữ liệu sau khi cập nhật
      onRefresh();
      
      // Tự động ẩn thông báo sau 3s
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái';
      setUpdateError(messageText);
      
      // Tự động ẩn thông báo lỗi sau 5s
      setTimeout(() => setUpdateError(null), 5000);
    }
  };

  const ordersByStatus = stats?.ordersByStatus ?? [];
  const filteredOrders = useMemo(() => {
    const source = stats?.recentOrders ?? [];
    if (!filterStatus) {
      return source;
    }
    return source.filter((order) => order.status === filterStatus);
  }, [stats, filterStatus]);

  // Tính doanh thu từ các đơn hàng đã thanh toán, đang giao và đã giao
  const confirmedRevenue = useMemo(() => {
    const orders = stats?.recentOrders ?? [];
    const confirmedStatuses = ['COMPLETED', 'SHIPPING', 'DELIVERED'];
    
    return orders
      .filter(order => confirmedStatuses.includes(order.status))
      .reduce((total, order) => {
        const price = typeof order.totalPrice === 'string' 
          ? parseFloat(order.totalPrice) 
          : order.totalPrice;
        return total + (price || 0);
      }, 0);
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-10 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">BẢNG QUẢN TRỊ</h1>
            <p className="text-slate-500 font-medium">Theo dõi doanh thu, đơn hàng và tạo sản phẩm hàng loạt</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onLogout}
              className="group flex items-center justify-center gap-2 bg-white border border-rose-200 px-6 py-3 rounded-2xl font-semibold text-sm text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm active:scale-95"
            >
              ĐĂNG XUẤT
            </button>
            <button
              onClick={() => onRefresh()}
              disabled={statsLoading}
              className={`group flex items-center justify-center gap-2 border px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm active:scale-95 ${
                statsLoading
                  ? 'bg-slate-200 border-slate-200 text-slate-500'
                  : 'bg-white border-indigo-100 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              }`}
            >
              LÀM MỚI DỮ LIỆU
            </button>
          </div>
        </div>

        {statsError && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-600">
            {statsError}
          </div>
        )}

        {updateError && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-600">
            {updateError}
          </div>
        )}

        {updateSuccess && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm font-semibold text-emerald-600">
            {updateSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Tổng đơn hàng" value={stats?.totalOrders ?? 0} icon="📦" color="blue" />
          <StatCard label="Số khách hàng" value={stats?.totalCustomers ?? 0} icon="👤" color="orange" />
          <StatCard label="Doanh thu hoàn tất" value={formatCurrency(confirmedRevenue)} icon="💰" color="emerald" dark />
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Lọc đơn theo trạng thái</h3>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4">
                <FilterTab label="Tất cả" count={stats?.totalOrders ?? 0} active={filterStatus === null} onClick={() => setFilterStatus(null)} />
                {ordersByStatus.map((statusItem) => (
                  <FilterTab
                    key={statusItem.status}
                    label={statusItem.status}
                    count={statusItem.count ?? 0}
                    active={filterStatus === statusItem.status}
                    onClick={() => setFilterStatus(statusItem.status)}
                  />
                ))}
              </div>
            </div>
          </div>

        <OrdersTable 
          orders={filteredOrders} 
          loading={statsLoading} 
          onSelectOrder={(order) => onSelectOrder(order)}
          onUpdateStatus={handleUpdateOrderStatus}
          accessToken={accessToken}
        />
        </div>

        {/* Products Management Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Quản lý sản phẩm</h2>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <SingleProductForm
              accessToken={accessToken}
              onSuccess={() => {
                onRefresh();
              }}
            />

            <CategoryManagement
              accessToken={accessToken}
              onSuccess={() => {
                onRefresh();
              }}
            />
          </div>

          <ProductManagement
            accessToken={accessToken}
            onSuccess={() => {
              onRefresh();
            }}
          />
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => onSelectOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
