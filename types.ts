
export interface Worker {
  id: string;
  fullName: string;
  code: string;
}

export interface Product {
  id: string;
  code: string; // Product ID / Articul
  name: string;
}

export interface Detail {
  id: string;
  name: string; // D1, D2, SONI...
}

export interface Price {
  id: string;
  productId: string;
  detailId: string;
  price: number;
}

export interface WorkLog {
  id: string;
  workDate: string; // YYYY-MM-DD
  workerId: string;
  productId: string;
  detailId: string;
  quantity: number;
  totalSum: number;
  batchId?: string; // Optional link to specific Batch
}

export interface Attendance {
  id: string;
  workDate: string; // YYYY-MM-DD
  workerId: string;
  isPresent: boolean;
}

// Helper interface for prices specific to a batch
export interface BatchPrice {
  detailId: string;
  price: number;
}

export interface Batch {
  id: string;
  batchNumber: string; // User facing ID e.g. "292"
  productId: string;
  size: string;
  color: string;
  quantity: number;
  prices: BatchPrice[]; // Store the snapshot of prices for this specific batch
}

export type Page = 'daily' | 'settings' | 'report' | 'warehouse' | 'templates' | 'attendance' | 'admin';
