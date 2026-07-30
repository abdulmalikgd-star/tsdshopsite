/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  images: string[];
  stock: number;
  createdAt: number;
  specs?: Record<string, string>;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingDetails: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
  };
  paymentMethod?: 'cod' | 'transfer';
  transferReceipt?: string | null;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'moderator' | 'user';
  createdAt: number;
}

export const CATEGORIES = [
  'هواتف ذكية',
  'أجهزة كمبيوتر',
  'ساعات ذكية',
  'سماعات',
  'إكسسوارات',
  'كاميرات',
  'ألعاب فيديو',
  'أجهزة منزلية',
];
