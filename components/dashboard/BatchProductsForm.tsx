'use client';

import React, { useState } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { formatCurrency, normalizeBatchProducts, resolveMessage, splitToList } from '@/lib/utils';
import { BatchProductInput, ManualProductFormState } from '@/types/product';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleManualFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
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

      const updated = [...parsed, newProduct];
      setJsonPayload(JSON.stringify(updated, null, 2));
      setManualForm(EMPTY_MANUAL_FORM);
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

      const res = await fetch(`${API_BASE_URL}/products/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(normalized),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const messageText = resolveMessage(payload, 'Không thể tạo sản phẩm.');
        throw new Error(messageText);
      }
      const createdCount = Array.isArray(payload) ? payload.length : normalized.length;
      const totalPrice = normalized.reduce<number>((total, item) => total + item.price, 0);
      setMessage(`Đã tạo ${createdCount} sản phẩm (${formatCurrency(totalPrice)}).`);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={jsonPayload}
          onChange={(event) => setJsonPayload(event.target.value)}
          className="w-full min-h-[200px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          spellCheck={false}
        />
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Thêm nhanh sản phẩm</p>
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
              name="imageBase64"
              value={manualForm.imageBase64}
              onChange={handleManualFormChange}
              placeholder="Link ảnh hoặc Base64"
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
