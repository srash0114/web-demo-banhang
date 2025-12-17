"use client";

import React, { useCallback, useState } from 'react';
import AuthView from '@/components/auth/AuthView';
import DashboardView from '@/components/dashboard/DashboardView';
import { useAuth } from '@/hooks/useAuth';
import { useOrderStats } from '@/hooks/useOrderStats';
import { Order } from '@/types/order';

export default function AdminDashboard() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    accessToken,
    authLoading,
    authError,
    authMessage,
    login,
    register,
    logout,
    resetFeedback,
    clearSession,
    setAuthError,
    setAuthMessage,
    isAuthenticated,
  } = useAuth();

  const handleUnauthorized = useCallback(() => {
    setAuthError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    setAuthMode('login');
    clearSession();
  }, [clearSession, setAuthError]);

  const { stats, statsLoading, statsError, fetchStats } = useOrderStats(accessToken, handleUnauthorized);

  const handleLogin = useCallback(
    async (payload: { email: string; password: string }) => {
      await login(payload);
      setAuthMessage('Đăng nhập thành công.');
      setSelectedOrder(null);
      setFilterStatus(null);
    },
    [login, setAuthMessage],
  );

  const handleRegister = useCallback(
    async (payload: { email: string; password: string; fullName?: string; shippingAddress?: string }) => {
      await register(payload);
    },
    [register],
  );

  if (!isAuthenticated || !accessToken) {
    return (
      <AuthView
        authMode={authMode}
        setAuthMode={setAuthMode}
        authLoading={authLoading}
        authError={authError}
        authMessage={authMessage}
        resetFeedback={resetFeedback}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <DashboardView
      stats={stats}
      statsLoading={statsLoading}
      statsError={statsError}
      onRefresh={() => void fetchStats()}
      onLogout={logout}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      selectedOrder={selectedOrder}
      onSelectOrder={setSelectedOrder}
      accessToken={accessToken}
    />
  );
}