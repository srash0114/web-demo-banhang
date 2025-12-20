'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { Category, CreateCategoryDto } from '@/types/category';
import { resolveMessage } from '@/lib/utils';

interface CategoryManagementProps {
  accessToken: string;
  onSuccess?: () => void;
}

export default function CategoryManagement({ accessToken, onSuccess }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<CreateCategoryDto>({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load categories khi component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error('Không thể tải danh sách categories');
      }
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi tải categories';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCategory.name.trim()) {
      setError('Tên category là bắt buộc');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description?.trim() || undefined,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const messageText = resolveMessage(payload, 'Không thể tạo category');
        throw new Error(messageText);
      }

      setMessage(`Đã tạo category "${newCategory.name}" thành công`);
      setNewCategory({ name: '', description: '' });
      setShowAddForm(false);
      await loadCategories();
      onSuccess?.();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi tạo category';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa category "${categoryName}"?\n\nLưu ý: Các sản phẩm trong category này sẽ không còn category.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const messageText = resolveMessage(payload, 'Không thể xóa category');
        throw new Error(messageText);
      }

      setMessage(`Đã xóa category "${categoryName}" thành công`);
      await loadCategories();
      onSuccess?.();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi xóa category';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-700">Quản lý danh mục</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Tạo, xóa và quản lý các danh mục sản phẩm
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl font-semibold text-sm transition-all shadow-sm active:scale-95"
        >
          {showAddForm ? '✕ Đóng' : '+ Thêm danh mục'}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 mb-4">
          {message}
        </div>
      )}

      {/* Form thêm category */}
      {showAddForm && (
        <form onSubmit={handleAddCategory} className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Thêm danh mục mới</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Tên danh mục *"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Mô tả (tùy chọn)"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newCategory.name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-2xl font-semibold text-sm transition-all shadow-sm active:scale-95"
          >
            {loading ? 'Đang tạo...' : 'Tạo danh mục'}
          </button>
        </form>
      )}

      {/* Danh sách categories */}
      <div className="space-y-3">
        {loading && categories.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Đang tải...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Chưa có danh mục nào</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 truncate">{category.name}</h4>
                    {category.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{category.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {category.products?.length ?? 0} sản phẩm
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    disabled={loading}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    title="Xóa danh mục"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={loadCategories}
        disabled={loading}
        className="mt-4 w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all shadow-sm active:scale-95"
      >
        {loading ? '⟳ Đang tải...' : '⟳ Làm mới danh sách'}
      </button>
    </div>
  );
}
