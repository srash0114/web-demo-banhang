'use client';

import React, { useState } from 'react';

type AuthMode = 'login' | 'register';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  fullName?: string;
  email: string;
  password: string;
  shippingAddress?: string;
};

interface AuthViewProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authLoading: boolean;
  authError: string | null;
  authMessage: string | null;
  resetFeedback: () => void;
  onLogin: (payload: LoginPayload) => Promise<unknown>;
  onRegister: (payload: RegisterPayload) => Promise<unknown>;
}

export default function AuthView({
  authMode,
  setAuthMode,
  authLoading,
  authError,
  authMessage,
  resetFeedback,
  onLogin,
  onRegister,
}: AuthViewProps) {
  const [loginForm, setLoginForm] = useState<LoginPayload>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterPayload>({
    fullName: '',
    email: '',
    password: '',
    shippingAddress: '',
  });

  const isLoginMode = authMode === 'login';

  const handleSwitchMode = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    resetFeedback();
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onLogin(loginForm);
    } catch (error) {
      console.warn('Đăng nhập không thành công:', error);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onRegister(registerForm);
      setAuthMode('login');
      setLoginForm((prev) => ({ ...prev, email: registerForm.email }));
    } catch (error) {
      console.warn('Đăng ký không thành công:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl grid gap-12 md:grid-cols-2">
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Bảng quản trị đơn hàng</h1>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed">
            Đăng ký tài khoản bán hàng hoặc đăng nhập để tạo sản phẩm hàng loạt và theo dõi doanh thu, đơn hàng mới nhất.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`px-5 py-2.5 rounded-2xl font-semibold text-xs uppercase tracking-widest border transition-all shadow-sm ${
                isLoginMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`px-5 py-2.5 rounded-2xl font-semibold text-xs uppercase tracking-widest border transition-all shadow-sm ${
                !isLoginMode
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200'
              }`}
            >
              Đăng ký
            </button>
          </div>
          {authError && <p className="mt-6 text-sm font-semibold text-rose-500">{authError}</p>}
          {authMessage && <p className="mt-2 text-sm font-semibold text-emerald-600">{authMessage}</p>}
        </div>

        <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-10">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6">{isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản mới'}</h2>
          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="seller@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="********"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className={`w-full py-3 rounded-2xl font-semibold text-xs uppercase tracking-widest transition-all shadow-md ${
                  authLoading ? 'bg-slate-300 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {authLoading ? 'Đang xử lý...' : 'Tiếp tục'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Họ và tên</label>
                <input
                  type="text"
                  value={registerForm.fullName ?? ''}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="seller@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="********"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Địa chỉ giao hàng</label>
                <textarea
                  value={registerForm.shippingAddress ?? ''}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, shippingAddress: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Số 1, Đường ABC, Quận 1"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className={`w-full py-3 rounded-2xl font-semibold text-xs uppercase tracking-widest transition-all shadow-md ${
                  authLoading ? 'bg-slate-300 text-slate-600' : 'bg-emerald-500 text-white hover:bg-emerald-400'
                }`}
              >
                {authLoading ? 'Đang xử lý...' : 'Tạo tài khoản'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
