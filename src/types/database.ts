export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  total: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  reference: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
