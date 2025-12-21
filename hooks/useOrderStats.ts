'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { resolveMessage, getNgrokHeaders } from '@/lib/utils';
import { OrderStats } from '@/types/order';

export function useOrderStats(accessToken: string | null, onUnauthorized?: () => void) {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!accessToken) {
      setStats(null);
      return;
    }
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/statistics`, {
        headers: getNgrokHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload) {
        if (res.status === 401 && onUnauthorized) {
          onUnauthorized();
        }
        const message = resolveMessage(payload, 'Không thể tải thống kê đơn hàng.');
        throw new Error(message);
      }
      setStats(payload as OrderStats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải thống kê đơn hàng.';
      setStatsError(message);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [accessToken, onUnauthorized]);

  useEffect(() => {
    if (accessToken) {
      void fetchStats();
    } else {
      setStats(null);
    }
  }, [accessToken, fetchStats]);

  return {
    stats,
    statsLoading,
    statsError,
    setStatsError,
    fetchStats,
  };
}
