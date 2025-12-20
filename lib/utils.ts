import { BatchProductInput, NormalizedBatchProduct } from '@/types/product';

export function resolveMessage(payload: unknown, fallback: string) {
  if (!payload) {
    return fallback;
  }
  if (typeof payload === 'string') {
    return payload;
  }
  if (Array.isArray(payload)) {
    return payload.join(', ');
  }
  if (typeof payload === 'object' && payload !== null) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join(', ');
    }
  }
  return fallback;
}

export function formatCurrency(value: string | number | undefined) {
  const numericValue = typeof value === 'string' ? Number(value) : value ?? 0;
  const safeValue = Number.isFinite(numericValue) ? Number(numericValue) : 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeValue);
}

export function normalizeBatchProducts(products: BatchProductInput[]): NormalizedBatchProduct[] {
  return products.map((product) => {
    const priceValue = typeof product.price === 'string' ? Number(product.price) : product.price;
    const ratingValue = product.rating !== undefined ? Number(product.rating) : 0;
    const reviewCountValue = product.reviewCount !== undefined ? Number(product.reviewCount) : 0;

    return {
      name: product.name?.trim() ?? '',
      price: Number.isFinite(priceValue) ? Number(priceValue) : 0,
      imageBase64: product.imageBase64 ?? '',
      description: product.description ?? '',
      rating: Number.isFinite(ratingValue) ? Number(ratingValue) : 0,
      reviewCount: Number.isFinite(reviewCountValue) ? Number(reviewCountValue) : 0,
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      colors: Array.isArray(product.colors) ? product.colors : [],
    };
  });
}

export function splitToList(input: string) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Convert File object thành base64 string
 * @param file File object từ input
 * @returns Promise với base64 string (bao gồm data URI prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as string'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Validate file hình ảnh
 * @param file File object cần validate
 * @param maxSizeMB Kích thước tối đa (MB)
 * @returns Error message hoặc null nếu hợp lệ
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): string | null {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)';
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Kích thước file không được vượt quá ${maxSizeMB}MB`;
  }

  return null;
}
