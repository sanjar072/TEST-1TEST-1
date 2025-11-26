import React, { useState, useMemo } from 'react';
import { Worker, Detail, Product, WorkLog, Attendance } from '../types';
import { Printer } from 'lucide-react';

interface ReportPageProps {
  workers: Worker[];
  details: Detail[];
  products: Product[];
  workLogs: WorkLog[];
  attendance: Attendance[];
}

export const ReportPage: React.FC<ReportPageProps> = ({
  workers, details, products, workLogs, attendance
}) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data Processing Logic (Pandas equivalent)
  const reportData = useMemo(() => {
    // 1. Filter data by date range
    const filteredLogs = workLogs.filter(l => 
      l.workDate >= startDate && 
      l.workDate <= endDate
    );

    const filteredAttendance = attendance.filter(a =>
      a.workDate >= startDate && 
      a.workDate <= endDate && 
      a.isPresent
    );

    // 2. Identify active details (columns for pivot)
    const activeDetailIds = Array.from(new Set(filteredLogs.map(l => l.detailId)));
    const activeDetails = details.filter(d => activeDetailIds.includes(d.id));

    // 3. Aggregate per worker
    const rows = workers.map(worker => {
      // A. Total Salary
      const workerLogs = filteredLogs.filter(l => l.workerId === worker.id);
      const totalSalary = workerLogs.reduce((sum, l) => sum + l.totalSum, 0);

      // B. Days Worked (Count unique dates present)
      const workerAttendance = filteredAttendance.filter(a => a.workerId === worker.id);
      const daysWorked = new Set(workerAttendance.map(a => a.workDate)).size;

      // C. Pivot Details (Sum quantity per detail)
      const detailQuantities: Record<string, number> = {};
      activeDetails.forEach(det => {
        const qty = workerLogs
          .filter(l => l.detailId === det.id)
          .reduce((sum, l) => sum + l.quantity, 0);
        detailQuantities[det.id] = qty;
      });

      return {
        worker,
        totalSalary,
        daysWorked,
        detailQuantities
      };
    });

    // Sort by name
    rows.sort((a, b) => a.worker.fullName.localeCompare(b.worker.fullName));

    // Calculate Totals Row
    const totals = {
      salary: rows.reduce((sum, r) => sum + r.totalSalary, 0),
      days: rows.reduce((sum, r) => sum + r.daysWorked, 0),
      details: {} as Record<string, number>
    };
    activeDetails.forEach(det => {
      totals.details[det.id] = rows.reduce((sum, r) => sum + (r.detailQuantities[det.id] || 0), 0);
    });

    return { rows, activeDetails, totals };
  }, [startDate, endDate, workers, workLogs, attendance, details]);

  return (
    <div className="space-y-6 max-w-full overflow-hidden print:overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-800">Отчет по Зарплате</h1>
        
        <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">С:</span>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">По:</span>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                />
            </div>
            </div>
            <button 
                onClick={() => window.print()}
                className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2"
            >
                <Printer size={18} /> Печать
            </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-black mb-1">Отчет по Зарплате</h1>
        <p className="text-sm text-gray-600">Период: {startDate} — {endDate}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border print:border-gray-300 print:rounded-none print:overflow-visible">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 print:bg-gray-100">
                <th className="py-4 px-4 font-semibold sticky left-0 bg-slate-100 z-10 border-r print:bg-transparent print:static">Сотрудник</th>
                <th className="py-4 px-4 font-semibold text-center border-r w-16">Код</th>
                <th className="py-4 px-4 font-bold text-right border-r text-indigo-700 bg-indigo-50 w-32 print:bg-transparent print:text-black">Зарплата</th>
                <th className="py-4 px-4 font-semibold text-center border-r w-16">Дни</th>
                {/* Dynamic Detail Columns */}
                {reportData.activeDetails.map(d => (
                  <th key={d.id} className="py-4 px-2 font-medium text-center border-r min-w-[60px] max-w-[100px] truncate print:whitespace-normal" title={d.name}>
                    {d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {reportData.rows.map(row => (
                <tr key={row.worker.id} className="hover:bg-gray-50 print:hover:bg-transparent break-inside-avoid">
                  <td className="py-2 px-4 font-medium text-slate-800 sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] print:shadow-none print:bg-transparent print:static">
                    {row.worker.fullName}
                  </td>
                  <td className="py-2 px-4 text-center font-mono text-slate-500 border-r">
                    {row.worker.code}
                  </td>
                  <td className="py-2 px-4 text-right font-bold font-mono text-indigo-600 bg-indigo-50/30 border-r print:bg-transparent print:text-black">
                    {row.totalSalary.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-center border-r">
                    {row.daysWorked}
                  </td>
                  {reportData.activeDetails.map(d => (
                    <td key={d.id} className="py-2 px-2 text-center text-gray-600 border-r">
                      {row.detailQuantities[d.id] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
              {reportData.rows.length === 0 && (
                 <tr><td colSpan={4 + reportData.activeDetails.length} className="p-8 text-center text-gray-400">Нет данных за этот период</td></tr>
              )}
            </tbody>
            {reportData.rows.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200 print:bg-gray-100 print:border-gray-400">
                <tr>
                  <td className="py-3 px-4 sticky left-0 bg-slate-50 z-10 border-r print:bg-transparent print:static">ИТОГО</td>
                  <td className="py-3 px-4 border-r"></td>
                  <td className="py-3 px-4 text-right text-indigo-800 border-r print:text-black">{reportData.totals.salary.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center border-r">{reportData.totals.days}</td>
                  {reportData.activeDetails.map(d => (
                    <td key={d.id} className="py-3 px-2 text-center border-r">
                      {reportData.totals.details[d.id]}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};