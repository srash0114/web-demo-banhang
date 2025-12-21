'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { resolveMessage, formatCurrency, getNgrokHeaders } from '@/lib/utils';
import { Category } from '@/types/category';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageBase64?: string;
  category?: Category;
  createdAt?: string;
  quantity?: number;
  isSoldOut?: boolean;
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Product | null>(null);
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: getNgrokHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
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
        headers: getNgrokHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
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
        headers: getNgrokHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
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

  const handleUpdateQuantity = async () => {
    if (!editingProduct) return;

    const quantity = Number(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      setError('Số lượng không hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: getNgrokHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const messageText = resolveMessage(payload, 'Không thể cập nhật số lượng');
        throw new Error(messageText);
      }

      const updatedProduct = await res.json();
      setMessage(`Đã cập nhật số lượng sản phẩm "${editingProduct.name}" thành công`);
      
      // Cập nhật state
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setEditingProduct(null);
      setNewQuantity('');
      onSuccess?.();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi cập nhật số lượng';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const requestBody = { categoryId: newCategoryId };
      console.log('[ProductManagement] Updating product category:', { productId: editingCategory.id, categoryId: newCategoryId });
      
      const res = await fetch(`${API_BASE_URL}/products/${editingCategory.id}`, {
        method: 'PATCH',
        headers: getNgrokHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        console.error('[ProductManagement] Failed to update category:', { status: res.status, payload });
        const messageText = resolveMessage(payload, 'Không thể cập nhật danh mục');
        throw new Error(messageText);
      }

      const updatedProduct = await res.json();
      console.log('[ProductManagement] Category updated successfully:', updatedProduct);
      setMessage(`Đã cập nhật danh mục sản phẩm "${editingCategory.name}" thành công`);
      
      // Cập nhật state
      setProducts(products.map(p => p.id === editingCategory.id ? updatedProduct : p));
      setEditingCategory(null);
      setNewCategoryId(null);
      onSuccess?.();
    } catch (err) {
      console.error('[ProductManagement] Error updating category:', err);
      const messageText = err instanceof Error ? err.message : 'Lỗi khi cập nhật danh mục';
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
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">
                        Kho: {product.quantity ?? 0}
                      </span>
                      {product.isSoldOut && (
                        <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-600 text-xs font-semibold">
                          Hết hàng
                        </span>
                      )}
                      {(product.quantity ?? 0) > 0 && (product.quantity ?? 0) <= 10 && !product.isSoldOut && (
                        <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-600 text-xs font-semibold">
                          Sắp hết
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(product);
                        setNewCategoryId(product.category?.id ?? null);
                      }}
                      disabled={loading}
                      className="opacity-0 group-hover:opacity-100 bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      title="Thay đổi danh mục"
                    >
                      Danh mục
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setNewQuantity(String(product.quantity ?? 0));
                      }}
                      disabled={loading}
                      className="opacity-0 group-hover:opacity-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      title="Chỉnh sửa số lượng"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      disabled={loading}
                      className="opacity-0 group-hover:opacity-100 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      title="Xóa sản phẩm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Quantity Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full">
            <h4 className="text-lg font-semibold text-slate-700 mb-4">Cập nhật số lượng</h4>
            <p className="text-sm text-slate-600 mb-4">
              Sản phẩm: <span className="font-semibold">{editingProduct.name}</span>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 mb-2">
                Số lượng mới
              </label>
              <input
                type="number"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewQuantity('');
                  setError(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateQuantity}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
                disabled={loading}
              >
                {loading ? 'Đang cập nhật...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full">
            <h4 className="text-lg font-semibold text-slate-700 mb-4">Thay đổi danh mục</h4>
            <p className="text-sm text-slate-600 mb-4">
              Sản phẩm: <span className="font-semibold">{editingCategory.name}</span>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 mb-2">
                Danh mục
              </label>
              <select
                value={newCategoryId ?? ''}
                onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              >
                <option value="">Không có danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryId(null);
                  setError(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateCategory}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
                disabled={loading}
              >
                {loading ? 'Đang cập nhật...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

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
