
import { Worker, Product, Detail, Price, WorkLog, Attendance, Batch } from '../types';

// Helper to generate ID
export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- INITIAL SEED DATA ---

const initialWorkers: Worker[] = [
  { id: 'w1', fullName: 'DILDORA', code: 'B1' },
  { id: 'w2', fullName: 'ASLIYA', code: 'A-01' },
  { id: 'w3', fullName: 'KARIM', code: 'C-05' },
];

const initialDetails: Detail[] = [
  { id: 'det1', name: 'D1' },
  { id: 'det2', name: 'D2' },
  { id: 'det3', name: 'SONI' },
  { id: 'det4', name: 'Карман' },
  { id: 'det5', name: 'Замок' },
  { id: 'det6', name: 'Упаковка' },
];

const initialProducts: Product[] = [
  { id: 'p1', code: '801', name: 'Джинсы Классика' },
  { id: 'p2', code: 'Z-930', name: 'Куртка Зимняя' },
  { id: 'p3', code: 'S-100', name: 'Шорты Летние' },
];

// Pre-fill prices for templates
const initialPrices: Price[] = [
  // Prices for Jeans (801)
  { id: 'pr1', productId: 'p1', detailId: 'det1', price: 1200 }, 
  { id: 'pr2', productId: 'p1', detailId: 'det2', price: 1500 },
  { id: 'pr3', productId: 'p1', detailId: 'det4', price: 800 }, 
  { id: 'pr4', productId: 'p1', detailId: 'det5', price: 500 },

  // Prices for Jacket (Z-930)
  { id: 'pr5', productId: 'p2', detailId: 'det1', price: 5000 },
  { id: 'pr6', productId: 'p2', detailId: 'det3', price: 3000 },
];

// Pre-fill a sample batch
const initialBatches: Batch[] = [
    {
        id: 'b1',
        batchNumber: '292',
        productId: 'p1',
        size: '36-40(z)',
        color: 'Черный',
        quantity: 600,
        prices: [
            { detailId: 'det1', price: 1200 },
            { detailId: 'det2', price: 1500 },
            { detailId: 'det4', price: 800 },
            { detailId: 'det5', price: 500 },
        ],
    }
];

// --- STORAGE LOGIC ---

// Changed prefix to v3 to force reset of old incompatible data due to department removal
const PREFIX = 'gfm_v3_';

export const loadData = <T>(key: string, defaultData: T): T => {
  const stored = localStorage.getItem(PREFIX + key);
  return stored ? JSON.parse(stored) : defaultData;
};

export const saveData = <T>(key: string, data: T) => {
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
};

export const DB = {
  workers: {
    key: 'workers',
    get: () => loadData<Worker[]>('workers', initialWorkers),
    set: (data: Worker[]) => saveData('workers', data),
  },
  products: {
    key: 'products',
    get: () => loadData<Product[]>('products', initialProducts),
    set: (data: Product[]) => saveData('products', data),
  },
  details: {
    key: 'details',
    get: () => loadData<Detail[]>('details', initialDetails),
    set: (data: Detail[]) => saveData('details', data),
  },
  prices: {
    key: 'prices',
    get: () => loadData<Price[]>('prices', initialPrices),
    set: (data: Price[]) => saveData('prices', data),
  },
  workLogs: {
    key: 'worklogs',
    get: () => loadData<WorkLog[]>('worklogs', []),
    set: (data: WorkLog[]) => saveData('worklogs', data),
  },
  attendance: {
    key: 'attendance',
    get: () => loadData<Attendance[]>('attendance', []),
    set: (data: Attendance[]) => saveData('attendance', data),
  },
  batches: {
    key: 'batches',
    get: () => loadData<Batch[]>('batches', initialBatches),
    set: (data: Batch[]) => saveData('batches', data),
  },
};
