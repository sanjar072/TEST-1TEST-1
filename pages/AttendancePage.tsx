
import React, { useState, useMemo } from 'react';
import { Worker, Attendance } from '../types';
import { generateId } from '../services/storage';
import { CalendarCheck, Check, X, CheckSquare, Square, CalendarRange, Table } from 'lucide-react';

interface AttendancePageProps {
  workers: Worker[];
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  workers, attendance, setAttendance
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  
  // Sort all workers alphabetically
  const allWorkers = useMemo(() => 
    [...workers].sort((a, b) => a.fullName.localeCompare(b.fullName)), 
  [workers]);

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <CalendarCheck className="text-indigo-600" />
            Табель Учета
            </h1>
            <p className="text-gray-500 text-sm mt-1">Управление посещаемостью всех сотрудников</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('input')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'input' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
                <CheckSquare size={16}/> Отметка (День)
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
                <Table size={16}/> История (Месяц)
            </button>
        </div>
      </div>

      {activeTab === 'input' ? (
        <DailyInputView 
            workers={allWorkers} 
            attendance={attendance} 
            setAttendance={setAttendance} 
        />
      ) : (
        <HistoryView 
            workers={allWorkers} 
            attendance={attendance} 
        />
      )}

    </div>
  );
};

// --- SUB-COMPONENT: DAILY INPUT ---
const DailyInputView: React.FC<{
    workers: Worker[];
    attendance: Attendance[];
    setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
}> = ({ workers, attendance, setAttendance }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const isPresent = (workerId: string) => 
        attendance.some(a => a.workerId === workerId && a.workDate === date && a.isPresent);
    
    const toggleAttendance = (workerId: string) => {
        const existing = attendance.find(a => a.workerId === workerId && a.workDate === date);
        if (existing) {
          setAttendance(attendance.filter(a => !(a.workerId === workerId && a.workDate === date)));
        } else {
          setAttendance([...attendance, { id: generateId(), workDate: date, workerId, isPresent: true }]);
        }
    };
    
    const markAll = (present: boolean) => {
        // Remove existing records for this date to prevent duplicates/conflicts
        const otherRecords = attendance.filter(a => a.workDate !== date);
        
        if (!present) {
            setAttendance(otherRecords);
        } else {
            const newRecords = workers.map(w => ({
                id: generateId(),
                workDate: date,
                workerId: w.id,
                isPresent: true
            }));
            setAttendance([...otherRecords, ...newRecords]);
        }
    };

    const presentCount = workers.filter(w => isPresent(w.id)).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-700">Выбрать дату:</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-slate-700 bg-white shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button onClick={() => markAll(true)} className="text-sm bg-green-50 text-green-700 px-3 py-2 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1 font-medium">
                            <CheckSquare size={16} /> Всех
                        </button>
                        <button onClick={() => markAll(false)} className="text-sm bg-gray-50 text-gray-700 px-3 py-2 rounded hover:bg-gray-100 border border-gray-200 flex items-center gap-1 font-medium">
                            <Square size={16} /> Никого
                        </button>
                    </div>
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm">
                        {presentCount} / {workers.length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map(w => {
                    const present = isPresent(w.id);
                    return (
                        <div 
                            key={w.id} 
                            onClick={() => toggleAttendance(w.id)}
                            className={`
                                relative flex items-center p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 select-none
                                ${present 
                                    ? 'bg-green-50 border-green-500 shadow-sm' 
                                    : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                                }
                            `}
                        >
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors
                                ${present ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
                            `}>
                                {present ? <Check size={20} strokeWidth={3} /> : <X size={20} />}
                            </div>
                            <div>
                                <div className={`font-bold text-lg ${present ? 'text-green-900' : 'text-gray-700'}`}>
                                    {w.fullName}
                                </div>
                                <div className={`text-sm font-mono ${present ? 'text-green-700' : 'text-gray-400'}`}>
                                    Код: {w.code}
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {workers.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">
                        Нет сотрудников
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: MONTHLY HISTORY VIEW ---
const HistoryView: React.FC<{
    workers: Worker[];
    attendance: Attendance[];
}> = ({ workers, attendance }) => {
    // Default to current month YYYY-MM
    const [monthStr, setMonthStr] = useState(new Date().toISOString().slice(0, 7));

    const daysInMonth = useMemo(() => {
        const [y, m] = monthStr.split('-').map(Number);
        const days = new Date(y, m, 0).getDate(); // Get last day of month
        return Array.from({ length: days }, (_, i) => i + 1);
    }, [monthStr]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <CalendarRange className="text-indigo-600" />
                    <span className="font-semibold text-gray-700">Обзор за месяц:</span>
                </div>
                <input 
                    type="month" 
                    value={monthStr}
                    onChange={e => setMonthStr(e.target.value)}
                    className="border rounded px-3 py-1.5 text-sm font-medium"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-20 bg-gray-100 border-b border-r py-3 px-4 min-w-[200px] text-gray-600 font-semibold text-sm">
                                Сотрудник
                            </th>
                            <th className="bg-indigo-50 border-b border-r px-2 text-center text-indigo-800 font-bold text-xs min-w-[50px]">
                                Всего
                            </th>
                            {daysInMonth.map(day => (
                                <th key={day} className="border-b border-r px-1 py-2 text-center text-xs text-gray-500 font-medium min-w-[30px]">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(w => {
                            // Filter attendance for this worker in this month
                            const workerAtt = attendance.filter(a => 
                                a.workerId === w.id && a.workDate.startsWith(monthStr) && a.isPresent
                            );
                            
                            // Create a set of present days [1, 5, 20...]
                            const presentDaysSet = new Set(workerAtt.map(a => parseInt(a.workDate.split('-')[2], 10)));

                            return (
                                <tr key={w.id} className="hover:bg-gray-50">
                                    <td className="sticky left-0 z-10 bg-white border-b border-r py-2 px-4 text-sm font-medium text-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        {w.fullName} <span className="text-gray-400 text-xs ml-1">({w.code})</span>
                                    </td>
                                    <td className="bg-indigo-50/30 border-b border-r text-center font-bold text-indigo-700 text-sm">
                                        {presentDaysSet.size}
                                    </td>
                                    {daysInMonth.map(day => {
                                        const isHere = presentDaysSet.has(day);
                                        return (
                                            <td key={day} className={`border-b border-r text-center p-0 ${isHere ? 'bg-green-50' : ''}`}>
                                                {isHere && (
                                                    <div className="flex justify-center items-center h-full w-full">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {workers.length === 0 && (
                            <tr>
                                <td colSpan={daysInMonth.length + 2} className="p-8 text-center text-gray-400">
                                    Нет сотрудников
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 flex gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Присутствовал</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full border border-gray-300 bg-white"></div>
                    <span>Отсутствовал</span>
                </div>
            </div>
        </div>
    );
};
