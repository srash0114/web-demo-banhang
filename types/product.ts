export interface BatchProductInput {
  name: string;
  price: string | number;
  imageBase64: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  sizes?: string[];
  colors?: string[];
  categoryId?: number; // ID của category (tùy chọn)
  quantity?: number; // Số lượng trong kho
  isSoldOut?: boolean; // Trạng thái bán hết
}

export interface ManualProductFormState {
  name: string;
  price: string;
  imageBase64: string;
  description: string;
  rating: string;
  reviewCount: string;
  sizes: string;
  colors: string;
  quantity: string; // Số lượng trong kho
}

export interface NormalizedBatchProduct {
  name: string;
  price: number;
  imageBase64: string;
  description: string;
  rating: number;
  reviewCount: number;
  sizes: string[];
  colors: string[];
  categoryId?: number; // ID của category (tùy chọn)
  quantity?: number; // Số lượng trong kho
  isSoldOut?: boolean; // Trạng thái bán hết
}
