'use client';

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { formatCurrency, normalizeBatchProducts, resolveMessage, splitToList, fileToBase64, validateImageFile } from '@/lib/utils';
import { BatchProductInput, ManualProductFormState } from '@/types/product';
import { Category } from '@/types/category';

interface BatchProductsFormProps {
  accessToken: string;
  onSuccess: () => Promise<void> | void;
}

const DEFAULT_PRODUCTS: BatchProductInput[] = [
  {
    name: 'Áo Thun In Họa Tiết',
    price: '250000',
    imageBase64: 'DATA_FOR_AO_THUN',
    description: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60',
    rating: 4.5,
    reviewCount: 10,
    sizes: ['S', 'M', 'L'],
    colors: ['Trắng', 'Xám'],
  },
  {
    name: 'Quần Jean Dáng Rộng',
    price: '450000',
    imageBase64: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=500&q=60',
    description: 'Quần jean ống rộng, chất liệu denim đứng form.',
    rating: 4.0,
    reviewCount: 25,
    sizes: ['29', '30', '31', '32'],
    colors: ['Xanh Đậm', 'Đen'],
  },
  {
    name: 'Váy Hoa Mùa Hè',
    price: '380000',
    imageBase64: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=500&q=60',
    description: 'Váy maxi hoa nhí, nhẹ nhàng cho mùa hè.',
    rating: 4.8,
    reviewCount: 5,
    sizes: ['S', 'M'],
    colors: ['Vàng', 'Hồng'],
  },
  {
    name: 'Áo Khoác Dáng Dài',
    price: '790000',
    imageBase64: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=60',
    description: 'Áo khoác dạ dáng dài, phong cách thanh lịch.',
    rating: 4.6,
    reviewCount: 15,
    sizes: ['M', 'L', 'XL'],
    colors: ['Xám', 'Be'],
  },
];

const EMPTY_MANUAL_FORM: ManualProductFormState = {
  name: '',
  price: '',
  imageBase64: '',
  description: '',
  rating: '',
  reviewCount: '',
  sizes: '',
  colors: '',
};

export default function BatchProductsForm({ accessToken, onSuccess }: BatchProductsFormProps) {
  const [jsonPayload, setJsonPayload] = useState(() => JSON.stringify(DEFAULT_PRODUCTS, null, 2));
  const [manualForm, setManualForm] = useState<ManualProductFormState>(EMPTY_MANUAL_FORM);
  const [manualImageFile, setManualImageFile] = useState<File | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories khi component mount
  useEffect(() => {
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
      // Không hiển thị lỗi nếu categories không load được
      console.error('Failed to load categories:', err);
    }
  };

  const handleManualFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file, 5);
    if (validationError) {
      setError(validationError);
      return;
    }

    setManualImageFile(file);
    setError(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setManualImagePreview(previewUrl);

    // Convert to base64 and set to form
    try {
      const base64 = await fileToBase64(file);
      setManualForm((prev) => ({ ...prev, imageBase64: base64 }));
    } catch (err) {
      setError('Không thể đọc file hình ảnh');
    }
  };

  const handleRemoveManualImage = () => {
    setManualImageFile(null);
    setManualImagePreview(null);
    setManualForm((prev) => ({ ...prev, imageBase64: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddProduct = () => {
    setError(null);
    setMessage(null);
    try {
      const parsed = parseProducts(jsonPayload);
      const newProduct: BatchProductInput = {
        name: manualForm.name.trim(),
        price: manualForm.price.trim(),
        imageBase64: manualForm.imageBase64.trim(),
        description: manualForm.description.trim(),
        rating: manualForm.rating ? Number(manualForm.rating) : undefined,
        reviewCount: manualForm.reviewCount ? Number(manualForm.reviewCount) : undefined,
        sizes: splitToList(manualForm.sizes),
        colors: splitToList(manualForm.colors),
      };

      if (!newProduct.name) {
        throw new Error('Tên sản phẩm là bắt buộc.');
      }
      if (!newProduct.price) {
        throw new Error('Giá sản phẩm là bắt buộc.');
      }
      if (!newProduct.description) {
        throw new Error('Mô tả sản phẩm là bắt buộc.');
      }
      if (!newProduct.imageBase64) {
        throw new Error('Hình ảnh là bắt buộc.');
      }

      const updated = [...parsed, newProduct];
      setJsonPayload(JSON.stringify(updated, null, 2));
      setManualForm(EMPTY_MANUAL_FORM);
      handleRemoveManualImage();
      setMessage(`Đã thêm ${newProduct.name} vào danh sách.`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Không thể thêm sản phẩm.';
      setError(messageText);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const parsed = parseProducts(jsonPayload);
      if (parsed.length === 0) {
        throw new Error('Danh sách sản phẩm không được để trống.');
      }
      const normalized = normalizeBatchProducts(parsed);

      // Thêm categoryId vào mỗi product nếu đã chọn
      const productsWithCategory = selectedCategoryId
        ? normalized.map(product => ({ ...product, categoryId: selectedCategoryId }))
        : normalized;

      const res = await fetch(`${API_BASE_URL}/products/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productsWithCategory),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const messageText = resolveMessage(payload, 'Không thể tạo sản phẩm.');
        throw new Error(messageText);
      }
      const createdCount = Array.isArray(payload) ? payload.length : productsWithCategory.length;
      const totalPrice = productsWithCategory.reduce<number>((total, item) => total + item.price, 0);
      
      const categoryName = selectedCategoryId 
        ? categories.find(c => c.id === selectedCategoryId)?.name 
        : null;
      const categoryMsg = categoryName ? ` trong danh mục "${categoryName}"` : '';
      
      setMessage(`Đã tạo ${createdCount} sản phẩm${categoryMsg} (${formatCurrency(totalPrice)}).`);
      await Promise.resolve(onSuccess());
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Không thể tạo sản phẩm.';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Tạo sản phẩm hàng loạt</h3>
      <p className="text-xs font-medium text-slate-500 mb-4">
        Gửi danh sách sản phẩm theo cấu trúc JSON đến API /products/batch để cập nhật nhanh catalog.
      </p>

      {/* Chọn Category */}
      {categories.length > 0 && (
        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 mb-2">
            Danh mục sản phẩm (tùy chọn)
          </label>
          <select
            value={selectedCategoryId ?? ''}
            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Không chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.products?.length ?? 0} sản phẩm)
              </option>
            ))}
          </select>
          {selectedCategoryId && (
            <p className="text-xs text-slate-500 mt-2">
              ✓ Tất cả sản phẩm sẽ được thêm vào danh mục "{categories.find(c => c.id === selectedCategoryId)?.name}"
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={jsonPayload}
          onChange={(event) => setJsonPayload(event.target.value)}
          className="w-full min-h-[200px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          spellCheck={false}
        />
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Thêm nhanh sản phẩm</p>
          
          {/* Image Upload Section */}
          <div className="col-span-full">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Hình ảnh sản phẩm</label>
            {manualImagePreview ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={manualImagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">{manualImageFile?.name}</p>
                  <p className="text-xs text-slate-400">{manualImageFile && (manualImageFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveManualImage}
                  className="flex-shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Xóa
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 text-center transition-all"
              >
                <span className="text-2xl">📸</span>
                <p className="text-xs font-semibold text-slate-600 mt-1">Click để chọn hình</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleManualImageSelect}
              className="hidden"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="name"
              value={manualForm.name}
              onChange={handleManualFormChange}
              placeholder="Tên sản phẩm"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              name="price"
              value={manualForm.price}
              onChange={handleManualFormChange}
              placeholder="Giá (VND)"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              name="rating"
              value={manualForm.rating}
              onChange={handleManualFormChange}
              placeholder="Đánh giá (0-5)"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              name="reviewCount"
              value={manualForm.reviewCount}
              onChange={handleManualFormChange}
              placeholder="Số lượt đánh giá"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              name="sizes"
              value={manualForm.sizes}
              onChange={handleManualFormChange}
              placeholder="Size (vd: S,M,L)"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              name="colors"
              value={manualForm.colors}
              onChange={handleManualFormChange}
              placeholder="Màu sắc (vd: Đỏ,Xanh)"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <textarea
            name="description"
            value={manualForm.description}
            onChange={handleManualFormChange}
            placeholder="Mô tả sản phẩm"
            rows={3}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddProduct}
            className="justify-self-start px-4 py-2 rounded-2xl font-semibold text-xs uppercase tracking-[0.3em] bg-white border border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
          >
            Thêm vào danh sách
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
        {message && <p className="text-xs font-semibold text-emerald-600">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-2xl font-semibold text-xs uppercase tracking-[0.3em] transition-all shadow-md ${
            loading ? 'bg-slate-300 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {loading ? 'Đang gửi...' : 'Gửi danh sách sản phẩm'}
        </button>
      </form>
    </div>
  );
}

function parseProducts(jsonPayload: string): BatchProductInput[] {
  if (!jsonPayload.trim()) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('JSON không hợp lệ. Vui lòng kiểm tra lại nội dung.');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Payload phải là một mảng sản phẩm.');
  }
  return parsed as BatchProductInput[];
}
