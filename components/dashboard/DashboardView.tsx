'use client';

import React, { useMemo } from 'react';
import { Order, OrderStats } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import StatCard from './StatCard';
import FilterTab from './FilterTab';
import OrdersTable from './OrdersTable';
import OrderDetailModal from './OrderDetailModal';
import BatchProductsForm from './BatchProductsForm';

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
  const ordersByStatus = stats?.ordersByStatus ?? [];
  const filteredOrders = useMemo(() => {
    const source = stats?.recentOrders ?? [];
    if (!filterStatus) {
      return source;
    }
    return source.filter((order) => order.status === filterStatus);
  }, [stats, filterStatus]);

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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Tổng đơn hàng" value={stats?.totalOrders ?? 0} icon="📦" color="blue" />
          <StatCard label="Số khách hàng" value={stats?.totalCustomers ?? 0} icon="👤" color="orange" />
          <StatCard label="Doanh thu hoàn tất" value={formatCurrency(stats?.totalRevenue)} icon="💰" color="emerald" dark />
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

        <OrdersTable orders={filteredOrders} loading={statsLoading} onSelectOrder={(order) => onSelectOrder(order)} />
          
          <BatchProductsForm
            accessToken={accessToken}
            onSuccess={async () => {
              await Promise.resolve(onRefresh());
            }}
          />
        </div>
      </div>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => onSelectOrder(null)} />}
    </div>
  );
}
