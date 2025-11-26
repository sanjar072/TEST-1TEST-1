
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DailyInputPage } from './pages/DailyInputPage';
import { AdminPage } from './pages/AdminPage';
import { ReportPage } from './pages/ReportPage';
import { WarehousePage } from './pages/WarehousePage';
import { TemplatesPage } from './pages/TemplatesPage';
import { AttendancePage } from './pages/AttendancePage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DB } from './services/storage';
import { Worker, Product, Detail, Price, WorkLog, Attendance, Page, Batch } from './types';

// Wrapper to handle routing logic inside Auth Context
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState<Page>('daily');
  
  // Data States
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [details, setDetails] = useState<Detail[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Load data on mount
  useEffect(() => {
    setWorkers(DB.workers.get());
    setProducts(DB.products.get());
    setDetails(DB.details.get());
    setPrices(DB.prices.get());
    setWorkLogs(DB.workLogs.get());
    setAttendance(DB.attendance.get());
    setBatches(DB.batches.get());
  }, []);

  // Persistence Effects
  useEffect(() => DB.workers.set(workers), [workers]);
  useEffect(() => DB.products.set(products), [products]);
  useEffect(() => DB.details.set(details), [details]);
  useEffect(() => DB.prices.set(prices), [prices]);
  useEffect(() => DB.workLogs.set(workLogs), [workLogs]);
  useEffect(() => DB.attendance.set(attendance), [attendance]);
  useEffect(() => DB.batches.set(batches), [batches]);

  if (isLoading) return <div className="flex h-screen items-center justify-center">Загрузка...</div>;

  if (!user) {
    return <LoginPage />;
  }

  // Role Based Access Logic
  const canAccess = (p: Page) => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'ACCOUNTANT' && p === 'report') return true;
    if (user.role === 'MANAGER') return ['daily', 'warehouse', 'attendance', 'templates', 'report'].includes(p);
    if (user.role === 'WORKER') return ['daily'].includes(p); // Workers essentially mostly view only
    return false;
  };

  const renderPage = () => {
    // @ts-ignore - Handle type string overlap
    if (page === 'settings' || page === 'admin') {
         if (user.role !== 'ADMIN') return <div className="p-8 text-center text-gray-500">Доступ запрещен.</div>;
         return (
          <AdminPage
            workers={workers}
            setWorkers={setWorkers}
            details={details}
            setDetails={setDetails}
          />
        );
    }

    if (!canAccess(page)) {
        return <div className="p-8 text-center text-gray-500">У вас нет доступа к этому разделу.</div>;
    }

    switch (page) {
      case 'daily':
        return (
          <DailyInputPage
            workers={workers}
            products={products}
            details={details}
            prices={prices}
            workLogs={workLogs}
            setWorkLogs={setWorkLogs}
            batches={batches}
          />
        );
      case 'attendance':
        return (
          <AttendancePage
            workers={workers}
            attendance={attendance}
            setAttendance={setAttendance}
          />
        );
      case 'warehouse':
        return (
          <WarehousePage
            products={products}
            details={details}
            prices={prices}
            setPrices={setPrices}
            batches={batches}
            setBatches={setBatches}
            workLogs={workLogs}
          />
        );
      case 'templates':
        return (
          <TemplatesPage
            products={products}
            setProducts={setProducts}
            details={details}
            prices={prices}
            setPrices={setPrices}
          />
        );
      case 'report':
        return (
          <ReportPage
            workers={workers}
            details={details}
            products={products}
            workLogs={workLogs}
            attendance={attendance}
          />
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans print:block print:h-auto print:bg-white">
      <Sidebar currentPage={page} setPage={setPage} />
      <main className="flex-1 p-4 md:p-8 overflow-auto print:p-0 print:overflow-visible print:h-auto print:block">
        {renderPage()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;