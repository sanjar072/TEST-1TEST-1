
import React, { useState } from 'react';
import { Product, Detail, Price } from '../types';
import { generateId } from '../services/storage';
import { Plus, Trash2, ShoppingBag, ClipboardList, Tag, Search } from 'lucide-react';

interface TemplatesPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  details: Detail[];
  prices: Price[];
  setPrices: React.Dispatch<React.SetStateAction<Price[]>>;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ products, setProducts, details, prices, setPrices }) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Create Product State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');

  // Add Detail State
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  const addProduct = () => {
    if (!newProdName || !newProdCode) return;
    const newId = generateId();
    setProducts([...products, { id: newId, name: newProdName, code: newProdCode }]);
    setNewProdName('');
    setNewProdCode('');
    setSelectedProductId(newId);
  };

  const deleteProduct = (id: string) => {
    if(confirm('Вы уверены, что хотите удалить этот шаблон?')) {
        setProducts(products.filter(p => p.id !== id));
        setPrices(prices.filter(p => p.productId !== id));
        if (selectedProductId === id) setSelectedProductId(null);
    }
  };

  const addDetailToProduct = () => {
    if (!selectedProductId || !selectedDetailId || !newPrice) return;
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal)) return;

    // Check if exists
    const exists = prices.some(p => p.productId === selectedProductId && p.detailId === selectedDetailId);
    if (exists) {
        alert("Эта деталь уже добавлена к шаблону");
        return;
    }

    setPrices([...prices, { 
        id: generateId(), 
        productId: selectedProductId, 
        detailId: selectedDetailId, 
        price: priceVal 
    }]);
    setSelectedDetailId('');
    setNewPrice('');
  };

  const removeDetailFromProduct = (priceId: string) => {
    setPrices(prices.filter(p => p.id !== priceId));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const productPrices = prices.filter(p => p.productId === selectedProductId);

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
        <div className="flex justify-between items-center shrink-0">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <ClipboardList className="text-indigo-600" />
                Шаблоны (Модели Товаров)
            </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Template List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b space-y-3 bg-gray-50">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Поиск по коду или названию..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="space-y-2 pt-2 border-t">
                    <h3 className="text-xs font-bold text-gray-500 uppercase">Новый шаблон</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            className="border rounded px-3 py-2 text-sm"
                            placeholder="Код (Артикул)"
                            value={newProdCode}
                            onChange={e => setNewProdCode(e.target.value)}
                        />
                        <input
                            className="border rounded px-3 py-2 text-sm"
                            placeholder="Название модели"
                            value={newProdName}
                            onChange={e => setNewProdName(e.target.value)}
                        />
                    </div>
                    <button onClick={addProduct} disabled={!newProdName || !newProdCode} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 font-medium">
                        Создать модель
                    </button>
                </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredProducts.map(p => (
                <div 
                    key={p.id} 
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-3 rounded-lg cursor-pointer border flex justify-between items-center group transition-colors ${
                        selectedProductId === p.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-gray-50 border-transparent'
                    }`}
                >
                    <div className="overflow-hidden">
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                            <Tag size={14} className="text-indigo-400"/> {p.code}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{p.name}</div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-2"
                        title="Удалить модель"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            {filteredProducts.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                    {products.length === 0 ? "Создайте первый шаблон" : "Ничего не найдено"}
                </div>
            )}
            </div>
        </div>

        {/* Right Column: Details & Prices for Selected Product */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            {selectedProduct ? (
                <>
                    <div className="p-6 border-b bg-gray-50">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ShoppingBag className="text-indigo-600" />
                                    {selectedProduct.code}
                                </h3>
                                <p className="text-gray-600 font-medium">{selectedProduct.name}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-gray-500 block">Всего деталей</span>
                                <span className="text-xl font-bold text-slate-800">{productPrices.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-50/30 border-b border-indigo-100">
                         <h4 className="text-sm font-bold text-indigo-900 mb-2">Добавить процесс (Деталь)</h4>
                         <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Деталь</label>
                                <select 
                                    className="w-full border rounded px-3 py-2 bg-white"
                                    value={selectedDetailId}
                                    onChange={e => setSelectedDetailId(e.target.value)}
                                >
                                    <option value="">Выберите деталь...</option>
                                    {details
                                        .filter(d => !productPrices.some(pp => pp.detailId === d.id))
                                        .map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-40">
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Цена (сум)</label>
                                <input 
                                    type="number"
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="0"
                                    value={newPrice}
                                    onChange={e => setNewPrice(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={addDetailToProduct}
                                disabled={!selectedDetailId || !newPrice}
                                className="bg-indigo-600 text-white px-4 py-2 rounded h-[40px] hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                            >
                                <Plus size={18} /> Добавить
                            </button>
                        </div>
                        {details.length === 0 && (
                            <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                <Search size={12}/> В справочнике нет деталей. Перейдите в настройки, чтобы создать их.
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
                                <tr>
                                    <th className="p-4 font-medium">Название детали (Процесса)</th>
                                    <th className="p-4 text-right font-medium">Стоимость работы</th>
                                    <th className="p-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {productPrices.map(pp => (
                                    <tr key={pp.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">
                                            {details.find(d => d.id === pp.detailId)?.name || <span className="text-red-500 italic">Удалено</span>}
                                        </td>
                                        <td className="p-4 text-right font-mono text-indigo-700 font-bold text-lg">
                                            {pp.price.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => removeDetailFromProduct(pp.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {productPrices.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-12 text-center text-gray-400">
                                            <ClipboardList size={48} className="mx-auto mb-3 opacity-20"/>
                                            <p>Список процессов пуст.</p>
                                            <p className="text-sm">Добавьте детали, чтобы сформировать цену изготовления.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                    <ShoppingBag size={64} className="mb-4 text-gray-200" />
                    <h3 className="text-lg font-medium text-gray-500">Шаблон не выбран</h3>
                    <p className="text-sm max-w-xs text-center mt-2">
                        Выберите модель из списка слева или создайте новую, чтобы настроить технологическую карту.
                    </p>
                </div>
            )}
        </div>
        </div>
    </div>
  );
};
