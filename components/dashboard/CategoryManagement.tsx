'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { Category, CreateCategoryDto } from '@/types/category';
import { resolveMessage, formatCurrency, getNgrokHeaders } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageBase64?: string;
  category?: Category;
  quantity?: number;
  isSoldOut?: boolean;
}

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
  
  // Modal quản lý sản phẩm trong category
  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load categories khi component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: getNgrokHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
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
        headers: getNgrokHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }),
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
        headers: getNgrokHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
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

  const loadCategoryProducts = async (categoryId: number) => {
    setLoadingProducts(true);
    try {
      // Load products thuộc category này
      const resCategory = await fetch(`${API_BASE_URL}/products/random?count=100`, {
        headers: getNgrokHeaders({ Authorization: `Bearer ${accessToken}` }),
      });
      if (resCategory.ok) {
        const allProds = await resCategory.json();
        const categoryProds = allProds.filter((p: Product) => p.category?.id === categoryId);
        setCategoryProducts(categoryProds);
        
        // Load tất cả products để có thể thêm vào category
        setAllProducts(allProds);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleManageProducts = (category: Category) => {
    setManagingCategory(category);
    loadCategoryProducts(category.id);
  };

  const handleAddProductToCategory = async (productId: number) => {
    if (!managingCategory) return;

    setLoadingProducts(true);
    setError(null);
    try {
      const requestBody = { productId };
      console.log('[CategoryManagement] Adding product to category:', { productId, categoryId: managingCategory.id });
      
      // Sử dụng endpoint mới: POST /categories/:id/products
      const res = await fetch(`${API_BASE_URL}/categories/${managingCategory.id}/products`, {
        method: 'POST',
        headers: getNgrokHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        console.error('[CategoryManagement] Failed to add product:', { status: res.status, payload });
        const messageText = resolveMessage(payload, 'Không thể thêm sản phẩm vào danh mục');
        throw new Error(messageText);
      }

      const result = await res.json();
      console.log('[CategoryManagement] Product added successfully:', result);
      setMessage('Đã thêm sản phẩm vào danh mục thành công');
      await loadCategoryProducts(managingCategory.id);
      await loadCategories();
    } catch (err) {
      console.error('[CategoryManagement] Error adding product:', err);
      const messageText = err instanceof Error ? err.message : 'Lỗi khi thêm sản phẩm';
      setError(messageText);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRemoveProductFromCategory = async (productId: number) => {
    if (!managingCategory) return;

    setLoadingProducts(true);
    setError(null);
    try {
      console.log('[CategoryManagement] Removing product from category:', { productId, categoryId: managingCategory.id });
      
      // Sử dụng endpoint mới: DELETE /categories/:id/products/:productId
      const res = await fetch(`${API_BASE_URL}/categories/${managingCategory.id}/products/${productId}`, {
        method: 'DELETE',
        headers: getNgrokHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        console.error('[CategoryManagement] Failed to remove product:', { status: res.status, payload });
        const messageText = resolveMessage(payload, 'Không thể xóa sản phẩm khỏi danh mục');
        throw new Error(messageText);
      }

      const result = await res.json();
      console.log('[CategoryManagement] Product removed successfully:', result);
      setMessage('Đã xóa sản phẩm khỏi danh mục thành công');
      await loadCategoryProducts(managingCategory.id);
      await loadCategories();
    } catch (err) {
      console.error('[CategoryManagement] Error removing product:', err);
      const messageText = err instanceof Error ? err.message : 'Lỗi khi xóa sản phẩm';
      setError(messageText);
    } finally {
      setLoadingProducts(false);
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
                className="group relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 hover:shadow-md transition-all min-h-[110px]"
              >
                {/* Nội dung danh mục */}
                <div className="flex flex-col h-full">
                  <div className="flex-1 min-w-0 pr-8"> {/* pr-8: Tránh text bị đè bởi nút action */}
                    <h4 className="font-semibold text-slate-800 truncate" title={category.name}>
                      {category.name}
                    </h4>
                    {category.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{category.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {category.productCount ?? 0} sản phẩm
                    </p>
                  </div>
                </div>

                {/* Các nút thao tác (Nổi lên trên góc phải) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-100 shadow-sm">
                    <button
                      onClick={() => handleManageProducts(category)}
                      disabled={loading}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap active:scale-95"
                      title="Quản lý sản phẩm"
                    >
                      Sản phẩm
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      disabled={loading}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap active:scale-95"
                      title="Xóa danh mục"
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

      <button
        onClick={loadCategories}
        disabled={loading}
        className="mt-4 w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all shadow-sm active:scale-95"
      >
        {loading ? '⟳ Đang tải...' : '⟳ Làm mới danh sách'}
      </button>

      {/* Modal quản lý sản phẩm trong category */}
      {managingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-700">
                  Quản lý sản phẩm - {managingCategory.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {categoryProducts.length} sản phẩm trong danh mục
                </p>
              </div>
              <button
                onClick={() => {
                  setManagingCategory(null);
                  setCategoryProducts([]);
                  setAllProducts([]);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
              >
                ✕ Đóng
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

            {/* Sản phẩm trong danh mục */}
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-slate-700 mb-3">Sản phẩm trong danh mục</h5>
              {loadingProducts ? (
                <div className="text-center py-8 text-slate-500">Đang tải...</div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl">
                  Chưa có sản phẩm nào trong danh mục này
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:shadow-sm transition-all"
                    >
                      {product.imageBase64 && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-100">
                          <img src={product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h6 className="font-semibold text-sm text-slate-800 truncate">{product.name}</h6>
                        <p className="text-xs text-indigo-600 font-semibold">{formatCurrency(product.price)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveProductFromCategory(product.id)}
                        disabled={loadingProducts}
                        className="flex-shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thêm sản phẩm vào danh mục */}
            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-3">Thêm sản phẩm vào danh mục</h5>
              {loadingProducts ? (
                <div className="text-center py-8 text-slate-500">Đang tải...</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {allProducts
                    .filter(p => !p.category || p.category.id !== managingCategory.id)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
                      >
                        {product.imageBase64 && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-100">
                            <img src={product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h6 className="font-semibold text-sm text-slate-800 truncate">{product.name}</h6>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-indigo-600 font-semibold">{formatCurrency(product.price)}</p>
                            {product.category && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-semibold">
                                {product.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddProductToCategory(product.id)}
                          disabled={loadingProducts}
                          className="flex-shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        >
                          + Thêm
                        </button>
                      </div>
                    ))}
                  {allProducts.filter(p => !p.category || p.category.id !== managingCategory.id).length === 0 && (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl">
                      Tất cả sản phẩm đã được thêm vào danh mục
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}