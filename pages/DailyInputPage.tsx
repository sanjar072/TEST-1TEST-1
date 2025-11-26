
import React, { useState } from 'react';
import { Worker, Product, Detail, Price, WorkLog, Batch } from '../types';
import { generateId } from '../services/storage';
import { AlertCircle, PlusCircle, Box, Calendar, AlertTriangle } from 'lucide-react';

interface DailyInputProps {
  workers: Worker[];
  products: Product[];
  details: Detail[];
  prices: Price[];
  workLogs: WorkLog[];
  setWorkLogs: React.Dispatch<React.SetStateAction<WorkLog[]>>;
  batches: Batch[];
}

export const DailyInputPage: React.FC<DailyInputProps> = ({
  workers, products, details, prices, workLogs, setWorkLogs, batches
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Sort workers alphabetically
  const sortedWorkers = [...workers].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Ежедневный Ввод (Выработка)</h1>
        <div className="flex gap-4 bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 pl-2 pr-4">
            <Calendar size={18} className="text-gray-400"/>
            <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="border-none outline-none text-slate-700 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Production Entry Form */}
        <div className="lg:col-span-1">
          <ProductionForm 
            date={date} 
            workers={sortedWorkers} 
            products={products} 
            details={details} 
            prices={prices}
            batches={batches} 
            addLog={(log) => setWorkLogs(prev => [log, ...prev])}
            workLogs={workLogs}
          />
        </div>
        
        {/* Log Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700 flex justify-between items-center">
              <span>Выработка за сегодня</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                {workLogs.filter(l => l.workDate === date).length} записей
              </span>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Сотрудник</th>
                    <th className="py-3 px-4">Партия / Товар</th>
                    <th className="py-3 px-4">Деталь</th>
                    <th className="py-3 px-4 text-right">Кол-во</th>
                    <th className="py-3 px-4 text-right">Сумма</th>
                    <th className="py-3 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workLogs
                    .filter(l => l.workDate === date)
                    .map(log => {
                      const batch = batches.find(b => b.id === log.batchId);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium">
                            {workers.find(w => w.id === log.workerId)?.fullName}
                          </td>
                          <td className="py-2 px-4">
                            {batch && (
                                <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                                    <Box size={10} /> Партия: {batch.batchNumber}
                                </div>
                            )}
                            <div className="flex items-center">
                                {products.find(p => p.id === log.productId)?.name}
                            </div>
                          </td>
                          <td className="py-2 px-4">{details.find(d => d.id === log.detailId)?.name}</td>
                          <td className="py-2 px-4 text-right font-mono">{log.quantity}</td>
                          <td className="py-2 px-4 text-right font-mono font-semibold text-indigo-600">
                            {log.totalSum.toLocaleString()}
                          </td>
                          <td className="py-2 px-4">
                            <button 
                              onClick={() => setWorkLogs(prev => prev.filter(p => p.id !== log.id))}
                              className="text-gray-400 hover:text-red-500"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      );
                  })}
                  {workLogs.filter(l => l.workDate === date).length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Записей нет</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
};

const ProductionForm: React.FC<{
  date: string;
  workers: Worker[];
  products: Product[];
  details: Detail[];
  prices: Price[];
  batches: Batch[];
  addLog: (log: WorkLog) => void;
  workLogs: WorkLog[];
}> = ({ date, workers, products, details, prices, batches, addLog, workLogs }) => {
  const [workerId, setWorkerId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [productId, setProductId] = useState('');
  const [detailId, setDetailId] = useState('');
  const [qty, setQty] = useState('');

  // When batch is selected, auto-select product
  const handleBatchChange = (bId: string) => {
    setBatchId(bId);
    if (bId) {
        const batch = batches.find(b => b.id === bId);
        if (batch) {
            setProductId(batch.productId);
            setDetailId(''); // Reset detail as potential list changes
        }
    } else {
        setProductId('');
    }
  };

  // Calc price
  const currentPrice = React.useMemo(() => {
    if (batchId) {
        const batch = batches.find(b => b.id === batchId);
        if (batch && batch.prices) {
            const batchPrice = batch.prices.find(p => p.detailId === detailId);
            if (batchPrice) return { price: batchPrice.price };
        }
    }
    return prices.find(p => p.productId === productId && p.detailId === detailId);
  }, [productId, detailId, prices, batchId, batches]);

  const availableDetails = React.useMemo(() => {
    if (batchId) {
        const batch = batches.find(b => b.id === batchId);
        if (batch && batch.prices && batch.prices.length > 0) {
            return details.filter(d => batch.prices.some(bp => bp.detailId === d.id));
        }
    }
    if (!productId) return [];
    const validDetailIds = prices.filter(p => p.productId === productId).map(p => p.detailId);
    return details.filter(d => validDetailIds.includes(d.id));
  }, [productId, prices, details, batchId, batches]);

  // Validation Logic
  const validation = React.useMemo(() => {
    if (!batchId || !detailId) return { max: Infinity, remaining: Infinity, isOver: false };

    const batch = batches.find(b => b.id === batchId);
    if (!batch) return { max: Infinity, remaining: Infinity, isOver: false };

    // Calculate sum of ALREADY logged work for this batch & detail
    const completed = workLogs
        .filter(l => l.batchId === batchId && l.detailId === detailId)
        .reduce((sum, l) => sum + l.quantity, 0);
    
    const remaining = Math.max(0, batch.quantity - completed);
    const inputQty = parseInt(qty || '0', 10);
    
    return {
        max: batch.quantity,
        remaining,
        isOver: inputQty > remaining
    };
  }, [batchId, detailId, qty, batches, workLogs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId || !batchId || !productId || !detailId || !qty) return;
    if (validation.isOver) return;

    const quantity = parseInt(qty, 10);
    const price = currentPrice?.price || 0;
    
    addLog({
      id: generateId(),
      workDate: date,
      workerId,
      productId,
      detailId,
      quantity,
      totalSum: quantity * price,
      batchId: batchId || undefined
    });
    
    setQty('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 ring-1 ring-indigo-50">
      <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
        <PlusCircle className="text-indigo-500" /> Добавить выработку
      </h3>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Сотрудник</label>
          <select required className="w-full border rounded-lg px-3 py-2 bg-white" value={workerId} onChange={e => setWorkerId(e.target.value)}>
            <option value="">Выберите...</option>
            {workers.map(w => <option key={w.id} value={w.id}>{w.code} - {w.fullName}</option>)}
          </select>
        </div>

        {/* Batch Selection */}
        <div className="bg-indigo-50/50 p-3 rounded border border-indigo-100 -mx-2 grid gap-3">
            <div>
                <label className="block text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1">
                    <Box size={12}/> № Партии (ID) <span className="text-red-500">*</span>
                </label>
                <select 
                    required
                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white" 
                    value={batchId} 
                    onChange={e => handleBatchChange(e.target.value)}
                >
                    <option value="">Выберите партию...</option>
                    {batches.map(b => {
                        const pName = products.find(p => p.id === b.productId)?.code;
                        return <option key={b.id} value={b.id}>#{b.batchNumber} - {pName} ({b.quantity} шт)</option>
                    })}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Товар</label>
                <select 
                    required 
                    className={`w-full border rounded-lg px-3 py-2 bg-white ${batchId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                    value={productId} 
                    onChange={e => { setProductId(e.target.value); setDetailId(''); }}
                    disabled={!!batchId} 
                >
                    <option value="">Выберите товар...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                </select>
            </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Деталь (Процесс)</label>
          <select 
            required 
            className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-100 disabled:text-gray-400" 
            value={detailId} 
            onChange={e => setDetailId(e.target.value)}
            disabled={!productId}
          >
            <option value="">
                {!productId ? 'Сначала выберите товар' : availableDetails.length === 0 ? 'Нет деталей для товара' : 'Выберите деталь...'}
            </option>
            {availableDetails.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
             <span>Количество</span>
             {batchId && detailId && (
                <span className={`text-[10px] px-1.5 rounded ${validation.remaining === 0 ? 'bg-red-100 text-red-600 font-bold' : 'bg-green-100 text-green-700'}`}>
                    Остаток: {validation.remaining}
                </span>
             )}
          </label>
          <div className="relative">
            <input 
                required
                type="number" 
                min="1"
                className={`w-full border rounded-lg px-3 py-2 font-mono ${validation.isOver ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-200' : ''}`}
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="0"
            />
            {validation.isOver && (
                <div className="absolute top-full right-0 mt-1 flex items-center gap-1 text-[10px] text-red-600 font-bold bg-white px-1 border border-red-200 rounded shadow-sm z-10">
                    <AlertTriangle size={10} />
                    Превышает остаток партии!
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-4">
        <div className="text-sm text-gray-600">
           Цена за шт: <span className="font-bold text-gray-900">{currentPrice ? currentPrice.price : 0} сум</span>
        </div>
        {!currentPrice && productId && detailId && (
          <div className="flex items-center text-xs text-amber-600 font-medium">
            <AlertCircle size={14} className="mr-1" /> Цена не задана!
          </div>
        )}
      </div>

      <button 
        type="submit"
        disabled={validation.isOver}
        className={`w-full font-semibold py-3 rounded-lg transition-colors shadow-md ${
            validation.isOver 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
        }`}
      >
        Добавить в список
      </button>
    </form>
  );
};
