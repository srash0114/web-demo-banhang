'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, TOKEN_STORAGE_KEY } from '@/lib/constants';
import { resolveMessage } from '@/lib/utils';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  fullName?: string;
  shippingAddress?: string;
};

interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const storeTokens = useCallback((tokens: StoredTokens | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!tokens || !tokens.accessToken) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
      }),
    );
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    storeTokens(null);
  }, [storeTokens]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setAuthLoading(true);
      setAuthError(null);
      setAuthMessage(null);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          const message = resolveMessage(data, 'Đăng nhập thất bại.');
          throw new Error(message);
        }
        const access = data.access_token as string | undefined;
        if (!access) {
          throw new Error('Phản hồi đăng nhập không hợp lệ.');
        }
        const refresh = (data.refresh_token as string | undefined) ?? null;
        setAccessToken(access);
        setRefreshToken(refresh);
        storeTokens({ accessToken: access, refreshToken: refresh ?? undefined });
        setAuthMessage('Đăng nhập thành công.');
        return { accessToken: access, refreshToken: refresh };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Đăng nhập thất bại.';
        setAuthError(message);
        clearSession();
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [clearSession, storeTokens],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setAuthLoading(true);
      setAuthError(null);
      setAuthMessage(null);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const message = resolveMessage(data, 'Đăng ký thất bại.');
          throw new Error(message);
        }
        setAuthMessage('Đăng ký thành công. Vui lòng đăng nhập.');
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Đăng ký thất bại.';
        setAuthError(message);
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setAuthMessage('Đã đăng xuất.');
  }, [clearSession]);

  const resetFeedback = useCallback(() => {
    setAuthError(null);
    setAuthMessage(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const storedRaw = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedRaw) {
        return;
      }
      const stored = JSON.parse(storedRaw) as StoredTokens;
      if (stored.accessToken) {
        setAccessToken(stored.accessToken);
        setRefreshToken(stored.refreshToken ?? null);
      }
    } catch (error) {
      console.warn('Không thể đọc token lưu trữ:', error);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  return {
    accessToken,
    refreshToken,
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
    isAuthenticated: Boolean(accessToken),
  };
}
