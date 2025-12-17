export interface OrderItem {
  id: number;
  quantity: number;
  price: string | number;
  size?: string | null;
  color?: string | null;
  product?: {
    name?: string;
    image?: string;
  };
}

export interface Order {
  id: number;
  createdAt: string;
  totalPrice: string | number;
  status: string;
  shippingAddress?: string;
  user?: {
    name?: string;
    email?: string;
  };
  items?: OrderItem[];
}

export interface OrderStats {
  totalOrders?: number;
  totalCustomers?: number;
  totalRevenue?: number | string;
  ordersByStatus?: { status: string; count: number }[];
  recentOrders?: Order[];
}
