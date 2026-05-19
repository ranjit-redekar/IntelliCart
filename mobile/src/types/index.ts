export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  categoryId: string;
}

export interface CartItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
}
