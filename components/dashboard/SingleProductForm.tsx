'use client';

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { formatCurrency, resolveMessage, splitToList, fileToBase64, validateImageFile, getNgrokHeaders } from '@/lib/utils';
import { Category } from '@/types/category';

interface SingleProductFormProps {
  accessToken: string;
  onSuccess: () => void;
}

export default function SingleProductForm({ accessToken, onSuccess }: SingleProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    rating: '',
    reviewCount: '',
    sizes: '',
    colors: '',
    categoryId: null as number | null,
    quantity: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: getNgrokHeaders({ Authorization: `Bearer ${accessToken}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      setError(validationError);
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Validate
      if (!formData.name.trim()) {
        throw new Error('Tên sản phẩm là bắt buộc');
      }
      if (!formData.price.trim()) {
        throw new Error('Giá sản phẩm là bắt buộc');
      }
      if (!formData.description.trim()) {
        throw new Error('Mô tả sản phẩm là bắt buộc');
      }
      if (!imageFile) {
        throw new Error('Vui lòng chọn hình ảnh sản phẩm');
      }

      // Convert image to base64
      const imageBase64 = await fileToBase64(imageFile);

      // Prepare payload
      const payload: any = {
        userId: 'admin', // Hoặc lấy từ auth context
        name: formData.name.trim(),
        price: formData.price.trim(),
        description: formData.description.trim(),
        imageBase64,
        rating: formData.rating ? Number(formData.rating) : undefined,
        reviewCount: formData.reviewCount ? Number(formData.reviewCount) : undefined,
        sizes: splitToList(formData.sizes),
        colors: splitToList(formData.colors),
        quantity: formData.quantity ? Number(formData.quantity) : undefined,
      };

      if (formData.categoryId) {
        payload.categoryId = formData.categoryId;
      }

      // Send request
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getNgrokHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => null);
      if (!res.ok) {
        const messageText = resolveMessage(responseData, 'Không thể tạo sản phẩm');
        throw new Error(messageText);
      }

      const categoryName = formData.categoryId
        ? categories.find((c) => c.id === formData.categoryId)?.name
        : null;
      const categoryMsg = categoryName ? ` trong danh mục "${categoryName}"` : '';

      setMessage(`Đã tạo sản phẩm "${formData.name}"${categoryMsg} thành công!`);

      // Reset form
      setFormData({
        name: '',
        price: '',
        description: '',
        rating: '',
        reviewCount: '',
        sizes: '',
        colors: '',
        categoryId: null,
        quantity: '',
      });
      handleRemoveImage();

      onSuccess();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Lỗi khi tạo sản phẩm';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Tạo sản phẩm mới</h3>
      <p className="text-xs font-medium text-slate-500 mb-4">
        Upload hình ảnh và điền thông tin để tạo sản phẩm mới
      </p>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 mb-2">
            Hình ảnh sản phẩm *
          </label>
          
          {imagePreview ? (
            <div className="space-y-3">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
                >
                  Đổi hình
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
                >
                  Xóa hình
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 text-center transition-all"
            >
              <div className="text-4xl mb-2">📸</div>
              <p className="text-sm font-semibold text-slate-600">Click để chọn hình ảnh</p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP, GIF (tối đa 5MB)</p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {imageFile && (
            <p className="text-xs text-slate-500 mt-2">
              📁 {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Product Info */}
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Tên sản phẩm *"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="Giá (VND) *"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <input
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.rating}
            onChange={handleInputChange}
            placeholder="Đánh giá (0-5)"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <input
            name="reviewCount"
            type="number"
            value={formData.reviewCount}
            onChange={handleInputChange}
            placeholder="Số lượt đánh giá"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <input
            name="sizes"
            value={formData.sizes}
            onChange={handleInputChange}
            placeholder="Size (vd: S,M,L,XL)"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <input
            name="colors"
            value={formData.colors}
            onChange={handleInputChange}
            placeholder="Màu sắc (vd: Đỏ,Xanh,Vàng)"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <input
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="Số lượng trong kho"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
        </div>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Mô tả sản phẩm *"
          rows={4}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />

        {/* Category Selection */}
        {categories.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 mb-2">
              Danh mục (tùy chọn)
            </label>
            <select
              name="categoryId"
              value={formData.categoryId ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  categoryId: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            >
              <option value="">Không chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preview Price */}
        {formData.price && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-600 mb-1">
              Giá hiển thị
            </p>
            <p className="text-2xl font-bold text-indigo-700">
              {formatCurrency(formData.price)}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !imageFile || !formData.name.trim() || !formData.price.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-95"
        >
          {loading ? '⏳ Đang tạo sản phẩm...' : '✨ Tạo sản phẩm'}
        </button>
      </form>
    </div>
  );
}
