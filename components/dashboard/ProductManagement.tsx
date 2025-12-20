'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { resolveMessage, formatCurrency } from '@/lib/utils';
import { Category } from '@/types/category';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageBase64?: string;
  category?: Category;
  createdAt?: string;
}

interface ProductManagementProps {
  accessToken: string;
  onSuccess?: () => void;
}

export default function ProductManagement({ accessToken, onSuccess }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Lấy products từ API (có thể dùng endpoint /products/random hoặc tạo endpoint mới)
      const res = await fetch(`${API_BASE_URL}/products/random?count=50`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error('Không thể tải danh sách sản phẩm');
      }
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi tải sản phẩm';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?\n\nLưu ý: Hành động này không thể hoàn tác.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const messageText = resolveMessage(payload, 'Không thể xóa sản phẩm');
        throw new Error(messageText);
      }

      setMessage(`Đã xóa sản phẩm "${productName}" thành công`);
      // Xóa khỏi state để cập nhật UI ngay lập tức
      setProducts(products.filter(p => p.id !== productId));
      onSuccess?.();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi xóa sản phẩm';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = filterCategory
    ? products.filter(p => p.category?.id === filterCategory)
    : products;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-700">Quản lý sản phẩm</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Xem và xóa các sản phẩm đã tạo
          </p>
        </div>
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

      {/* Filter by Category */}
      {categories.length > 0 && (
        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 mb-2">
            Lọc theo danh mục
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tất cả ({products.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilterCategory(category.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filterCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {category.name} ({products.filter(p => p.category?.id === category.id).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-3">
        {loading && products.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Đang tải...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {filterCategory ? 'Không có sản phẩm trong danh mục này' : 'Chưa có sản phẩm nào'}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  {product.imageBase64 && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={product.imageBase64}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 truncate">{product.name}</h4>
                    <p className="text-sm text-indigo-600 font-semibold mt-1">
                      {formatCurrency(product.price)}
                    </p>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                    )}
                    {product.category && (
                      <span className="inline-block mt-2 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold">
                        {product.category.name}
                      </span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    disabled={loading}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    title="Xóa sản phẩm"
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
        onClick={loadProducts}
        disabled={loading}
        className="mt-4 w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all shadow-sm active:scale-95"
      >
        {loading ? '⟳ Đang tải...' : '⟳ Làm mới danh sách'}
      </button>
    </div>
  );
}
