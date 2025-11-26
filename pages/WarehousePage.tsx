
import React, { useState } from 'react';
import { Product, Detail, Batch, Price, WorkLog } from '../types';
import { generateId } from '../services/storage';
import { Package, Plus, Trash2, Tag, AlertCircle, Activity } from 'lucide-react';

interface WarehousePageProps {
  products: Product[];
  details: Detail[];
  prices: Price[];
  setPrices: React.Dispatch<React.SetStateAction<Price[]>>;
  batches: Batch[];
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
  workLogs: WorkLog[]; // Added workLogs for statistics
}

export const WarehousePage: React.FC<WarehousePageProps> = ({ products, details, prices, setPrices, batches, setBatches, workLogs }) => {
  const [batchNum, setBatchNum] = useState('');
  const [productId, setProductId] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState('');

  // State for adding details on the fly
  const [newDetailId, setNewDetailId] = useState('');
  const [newDetailPrice, setNewDetailPrice] = useState('');

  const addBatch = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate ALL fields are filled
    if (!batchNum || !productId || !size || !color || !quantity) return;

    // Snapshot current prices for this product to the batch
    const batchPrices = prices
        .filter(p => p.productId === productId)
        .map(p => ({ detailId: p.detailId, price: p.price }));

    const newBatch: Batch = {
      id: generateId(),
      batchNumber: batchNum,
      productId,
      size,
      color,
      quantity: parseInt(quantity, 10),
      prices: batchPrices
    };

    setBatches([newBatch, ...batches]);
    
    // Reset form
    setBatchNum('');
    setProductId('');
    setSize('');
    setColor('');
    setQuantity('');
  };

  const deleteBatch = (id: string) => {
    if(confirm('Удалить эту партию?')) {
        setBatches(batches.filter(b => b.id !== id));
    }
  };

  // Helper to get detail names for a product
  const getProductDetails = (prodId: string) => {
    const prodPrices = prices.filter(p => p.productId === prodId);
    return prodPrices.map(p => {
        const d = details.find(det => det.id === p.detailId);
        return { 
          id: d?.id, 
          name: d ? d.name : '?' 
        };
    });
  };

  // Add Detail Logic
  const addDetailToProduct = () => {
    if (!productId || !newDetailId || !newDetailPrice) return;
    
    // Check duplication
    if (prices.some(p => p.productId === productId && p.detailId === newDetailId)) {
        alert('Эта деталь уже добавлена к товару!');
        return;
    }

    const newPriceEntry: Price = {
        id: generateId(),
        productId,
        detailId: newDetailId,
        price: parseFloat(newDetailPrice)
    };

    setPrices([...prices, newPriceEntry]);
    setNewDetailId('');
    setNewDetailPrice('');
  };

  const removeDetailFromProduct = (priceId: string) => {
    setPrices(prices.filter(p => p.id !== priceId));
  };

  const currentProductPrices = prices.filter(p => p.productId === productId);
  const availableDetails = details.filter(d => !currentProductPrices.some(p => p.detailId === d.id));

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Package className="text-indigo-600" />
          Склад (Партии)
        </h1>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Добавить новую партию</h3>
        <form onSubmit={addBatch} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">№ Партии (ID)</label>
                <input 
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="292"
                    value={batchNum}
                    onChange={e => setBatchNum(e.target.value)}
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Товар (Артикул)</label>
                <select 
                    required
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    value={productId}
                    onChange={e => { setProductId(e.target.value); setNewDetailId(''); }}
                >
                    <option value="">Выберите товар...</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                </select>
            </div>
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Размер</label>
                <input 
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="36-40(z)"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                />
            </div>
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Цвет</label>
                <input 
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Черный"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                />
            </div>
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Кол-во (пар)</label>
                <input 
                    required
                    type="number"
                    min="1"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="600"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                />
            </div>

            {/* DYNAMIC DETAILS SECTION */}
            {productId && (
                <div className="md:col-span-6 bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 mt-2">
                    <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                        <Tag size={16} />
                        Детали и расценки для: {products.find(p => p.id === productId)?.name}
                    </h4>

                    {/* Current Details List */}
                    {currentProductPrices.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {currentProductPrices.map(pp => {
                                const dName = details.find(d => d.id === pp.detailId)?.name;
                                return (
                                    <div key={pp.id} className="bg-white border border-indigo-200 rounded px-2 py-1 text-sm flex items-center gap-2 shadow-sm">
                                        <span className="font-medium text-gray-700">{dName}</span>
                                        <span className="bg-gray-100 px-1.5 rounded text-gray-600 text-xs">{pp.price} сум</span>
                                        <button 
                                            type="button" 
                                            onClick={() => removeDetailFromProduct(pp.id)} 
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-amber-600 text-sm mb-4 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                             <AlertCircle size={16} />
                             У этого товара еще нет деталей. Добавьте их ниже, чтобы начать работу.
                        </div>
                    )}

                    {/* Add Detail Form */}
                    <div className="flex gap-2 items-end max-w-2xl bg-white p-3 rounded border border-indigo-100 shadow-sm">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Добавить деталь</label>
                            <select 
                                className="w-full border rounded px-2 py-1 text-sm bg-white"
                                value={newDetailId}
                                onChange={e => setNewDetailId(e.target.value)}
                            >
                                <option value="">Выберите деталь из списка...</option>
                                {availableDetails.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Цена</label>
                            <input 
                                type="number" 
                                className="w-full border rounded px-2 py-1 text-sm"
                                placeholder="0"
                                value={newDetailPrice}
                                onChange={e => setNewDetailPrice(e.target.value)}
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={addDetailToProduct}
                            disabled={!newDetailId || !newDetailPrice}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                        >
                            <Plus size={14} /> Добавить
                        </button>
                    </div>
                </div>
            )}

            <div className="md:col-span-6 flex justify-end mt-2 pt-2 border-t">
                <button 
                    type="submit" 
                    className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-900 flex items-center gap-2 font-medium shadow-lg shadow-slate-200 transition-transform active:scale-95"
                >
                    <Plus size={18} /> Создать партию
                </button>
            </div>
        </form>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b">
                    <tr>
                        <th className="py-3 px-4 w-24">ID</th>
                        <th className="py-3 px-4 w-32">Артикул</th>
                        <th className="py-3 px-4">Товар</th>
                        <th className="py-3 px-4 w-24">Размер</th>
                        <th className="py-3 px-4 w-24">Цвет</th>
                        <th className="py-3 px-4 text-right w-24">Всего</th>
                        <th className="py-3 px-4">Статус Производства (Готово / Всего)</th>
                        <th className="py-3 px-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {batches.map(batch => {
                        const prod = products.find(p => p.id === batch.productId);
                        const prodDetailsInfo = getProductDetails(batch.productId); // { id, name }
                        
                        return (
                            <tr key={batch.id} className="hover:bg-gray-50 group">
                                <td className="py-3 px-4 font-bold text-gray-800">{batch.batchNumber}</td>
                                <td className="py-3 px-4 font-mono text-indigo-600 bg-indigo-50/30 font-medium">
                                    {prod?.code || '???'}
                                </td>
                                <td className="py-3 px-4 text-gray-700">{prod?.name}</td>
                                <td className="py-3 px-4 text-gray-600">{batch.size}</td>
                                <td className="py-3 px-4 text-gray-600">{batch.color || '-'}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                                    {batch.quantity}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-2">
                                        {prodDetailsInfo.length > 0 ? prodDetailsInfo.map((d, idx) => {
                                            // Calc stats
                                            // Get logs for this batch and this detail
                                            const completedQty = workLogs
                                                .filter(l => l.batchId === batch.id && l.detailId === d.id)
                                                .reduce((sum, l) => sum + l.quantity, 0);

                                            const percent = Math.min(100, Math.round((completedQty / batch.quantity) * 100));
                                            
                                            // Color coding
                                            let bgClass = "bg-gray-100 text-gray-600 border-gray-200"; // Started/Empty
                                            if (completedQty >= batch.quantity) bgClass = "bg-green-100 text-green-700 border-green-200";
                                            else if (completedQty > 0) bgClass = "bg-amber-50 text-amber-700 border-amber-200";

                                            return (
                                                <div key={idx} className={`flex flex-col border rounded px-2 py-1 text-xs ${bgClass} min-w-[80px]`}>
                                                    <span className="font-bold flex justify-between">
                                                        {d.name}
                                                        <span>{percent}%</span>
                                                    </span>
                                                    <span className="mt-0.5 font-mono text-[10px] opacity-80">
                                                        {completedQty} / {batch.quantity}
                                                    </span>
                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-black/10 h-1 mt-1 rounded-full overflow-hidden">
                                                        <div className="h-full bg-current" style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <span className="text-gray-400 text-xs italic">Нет деталей</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button 
                                        onClick={() => deleteBatch(batch.id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Удалить партию"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {batches.length === 0 && (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-400">Нет активных партий на складе</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
