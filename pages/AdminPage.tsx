
import React, { useState, useRef, useEffect } from 'react';
import { Worker, Detail, Product, Price, WorkLog, Attendance, Batch } from '../types';
import { generateId, DB } from '../services/storage';
import { adminService } from '../services/api';
import { Trash2, List, Users, Database, Download, Upload, AlertTriangle, CheckCircle, ShieldCheck, UserPlus, Lock } from 'lucide-react';
// @ts-ignore
import * as XLSX from 'xlsx';

interface AdminPageProps {
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  details: Detail[];
  setDetails: React.Dispatch<React.SetStateAction<Detail[]>>;
}

export const AdminPage: React.FC<AdminPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'users' | 'workers' | 'details' | 'db'>('users');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" />
            Админ Панель
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            label="Пользователи Системы" 
            icon={<ShieldCheck size={18}/>} 
          />
          <TabButton 
            active={activeTab === 'workers'} 
            onClick={() => setActiveTab('workers')} 
            label="Цеховые Сотрудники" 
            icon={<Users size={18}/>} 
          />
          <TabButton 
            active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')} 
            label="Справочник Деталей" 
            icon={<List size={18}/>} 
          />
          <TabButton 
            active={activeTab === 'db'} 
            onClick={() => setActiveTab('db')} 
            label="База Данных" 
            icon={<Database size={18}/>} 
          />
        </div>
        <div className="p-6">
          {activeTab === 'users' && <SystemUsersTab />}
          {activeTab === 'workers' && <OrganizationTab {...props} />}
          {activeTab === 'details' && <DetailsDictTab {...props} />}
          {activeTab === 'db' && <DatabaseTab {...props} />}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
      active ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

// --- 1. System Users Tab (NEW) ---
const SystemUsersTab: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('WORKER');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const data = await adminService.getUsers();
        setUsers(data);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!email || !password || !name) return;
        
        await adminService.addUser({ email, password, name, role });
        setName(''); setEmail(''); setPassword('');
        loadUsers();
    };

    const handleDeleteUser = async (id: number) => {
        if(confirm('Удалить пользователя?')) {
            await adminService.deleteUser(id);
            loadUsers();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <UserPlus size={20}/> Добавить пользователя
                </h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Имя</label>
                        <input className="w-full border rounded px-3 py-2 bg-white" placeholder="Иван Иванов" value={name} onChange={e=>setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email (Логин)</label>
                        <input className="w-full border rounded px-3 py-2 bg-white" placeholder="user@factory.com" value={email} onChange={e=>setEmail(e.target.value)} required type="email" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Пароль</label>
                        <input className="w-full border rounded px-3 py-2 bg-white" placeholder="******" value={password} onChange={e=>setPassword(e.target.value)} required type="password" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Роль</label>
                        <select className="w-full border rounded px-3 py-2 bg-white" value={role} onChange={e=>setRole(e.target.value)}>
                            <option value="ADMIN">Администратор</option>
                            <option value="MANAGER">Менеджер</option>
                            <option value="ACCOUNTANT">Бухгалтер</option>
                            <option value="WORKER">Сотрудник (Просмотр)</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 h-[42px]">Создать</button>
                </form>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-500">
                        <tr>
                            <th className="p-3">Имя</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Роль</th>
                            <th className="p-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium text-gray-900">{u.name}</td>
                                <td className="p-3 text-gray-600">{u.email}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                                        u.role === 'ACCOUNTANT' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 2. Database Tab (Import/Export) ---
const DatabaseTab: React.FC<any> = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const handleExport = () => {
    // Gather all data
    const wb = XLSX.utils.book_new();

    const dataMap: Record<string, any[]> = {
      'Workers': DB.workers.get(),
      'Details': DB.details.get(),
      'Products': DB.products.get(),
      'Prices': DB.prices.get(),
      'Batches': DB.batches.get(),
      'WorkLogs': DB.workLogs.get(),
      'Attendance': DB.attendance.get(),
    };

    // Create a sheet for each entity
    Object.keys(dataMap).forEach(key => {
      const ws = XLSX.utils.json_to_sheet(dataMap[key]);
      XLSX.utils.book_append_sheet(wb, ws, key);
    });

    // Download
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `SewingFactory_Backup_${dateStr}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Helper to read sheet
        const readSheet = (name: string) => {
          const ws = wb.Sheets[name];
          return ws ? XLSX.utils.sheet_to_json(ws) : [];
        };

        // Extract and Save
        const workers = readSheet('Workers');
        const details = readSheet('Details');
        const products = readSheet('Products');
        const prices = readSheet('Prices');
        const batches = readSheet('Batches');
        const logs = readSheet('WorkLogs');
        const att = readSheet('Attendance');

        if (workers.length) DB.workers.set(workers as Worker[]);
        if (details.length) DB.details.set(details as Detail[]);
        if (products.length) DB.products.set(products as Product[]);
        if (prices.length) DB.prices.set(prices as Price[]);
        if (batches.length) DB.batches.set(batches as Batch[]);
        if (logs.length) DB.workLogs.set(logs as WorkLog[]);
        if (att.length) DB.attendance.set(att as Attendance[]);

        setImportStatus({ msg: 'База данных успешно восстановлена! Страница перезагрузится...', type: 'success' });
        
        // Reload to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error(error);
        setImportStatus({ msg: 'Ошибка при чтении файла. Убедитесь, что это корректный backup файл.', type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Export Section */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
          <Download size={20}/> Экспорт данных (Backup)
        </h3>
        <p className="text-indigo-700 text-sm mb-4">
          Скачать все данные системы в один Excel файл.
        </p>
        <button 
          onClick={handleExport}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2"
        >
          <Download size={18} /> Скачать базу (.xlsx)
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
          <Upload size={20}/> Импорт данных (Восстановление)
        </h3>
        <p className="text-amber-800 text-sm mb-4 flex items-start gap-2">
          <AlertTriangle size={32} className="shrink-0 text-amber-600" />
          Внимание! Импорт файла полностью заменит текущие данные.
        </p>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-amber-300 text-amber-800 px-6 py-3 rounded-lg hover:bg-amber-100 font-medium shadow-sm flex items-center gap-2"
          >
            <Upload size={18} /> Выбрать файл и загрузить
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".xlsx, .xls"
            className="hidden" 
          />
        </div>
        
        {importStatus && (
          <div className={`mt-4 p-3 rounded flex items-center gap-2 text-sm font-medium ${
            importStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {importStatus.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
            {importStatus.msg}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 3. Details Dictionary Tab (Global Types) ---
const DetailsDictTab: React.FC<any> = ({ details, setDetails }) => {
    const [newName, setNewName] = useState('');

    const add = () => {
        if (!newName.trim()) return;
        setDetails([...details, { id: generateId(), name: newName.trim() }]);
        setNewName('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm mb-6">
                Здесь создаются <b>названия процессов</b> (D1, D2, Рукав, Спинка и т.д.), которые затем можно использовать в шаблонах.
            </div>

            <div className="flex gap-4">
                <input
                    className="flex-1 border rounded px-4 py-2"
                    placeholder="Название детали (например: D1)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && add()}
                />
                <button onClick={add} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                    Добавить
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {details.map((d: any) => (
                    <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border hover:border-gray-300 transition-colors">
                        <span className="font-medium text-gray-700">{d.name}</span>
                        <button onClick={() => setDetails(details.filter((x:any) => x.id !== d.id))} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 4. Organization Tab (Workers Only) ---
const OrganizationTab: React.FC<any> = ({ workers, setWorkers }) => {
  const [workerName, setWorkerName] = useState('');
  const [workerCode, setWorkerCode] = useState('');

  const addWorker = () => {
    if (!workerName || !workerCode) return;
    setWorkers([...workers, { id: generateId(), fullName: workerName, code: workerCode }]);
    setWorkerName('');
    setWorkerCode('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        {/* Workers */}
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-700 flex items-center gap-2"><Users size={20}/> Список Сотрудников (Цех)</h3>
            <p className="text-sm text-gray-500">Это сотрудники, которые выполняют работу и получают сдельную зарплату.</p>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                <div className="flex gap-3">
                    <input className="flex-1 border rounded px-3 py-2" placeholder="ФИО Сотрудника" value={workerName} onChange={e => setWorkerName(e.target.value)} />
                    <input className="w-1/3 border rounded px-3 py-2" placeholder="Таб. код (ID)" value={workerCode} onChange={e => setWorkerCode(e.target.value)} />
                </div>
                <button onClick={addWorker} disabled={!workerName || !workerCode} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50">Добавить сотрудника</button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-500">
                        <tr>
                            <th className="p-3 w-32">Код</th>
                            <th className="p-3">Имя</th>
                            <th className="p-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {workers.map((w: any) => (
                            <tr key={w.id} className="hover:bg-gray-50">
                                <td className="p-3 font-mono text-indigo-600 font-medium">{w.code}</td>
                                <td className="p-3">{w.fullName}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => setWorkers(workers.filter((x:any) => x.id !== w.id))} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {workers.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">Список сотрудников пуст</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};