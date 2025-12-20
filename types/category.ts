export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number; // Số lượng sản phẩm trong category
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}
