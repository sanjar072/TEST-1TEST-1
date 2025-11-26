
import React, { useState } from 'react';
import { LayoutDashboard, ShieldCheck, FileBarChart, Scissors, ChevronLeft, ChevronRight, Package, ClipboardList, CalendarCheck, LogOut, User as UserIcon } from 'lucide-react';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const allNavItems = [
    { id: 'attendance', label: 'Табель', icon: CalendarCheck, roles: ['ADMIN', 'MANAGER'] },
    { id: 'daily', label: 'Ежедневный Ввод', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'WORKER'] },
    { id: 'warehouse', label: 'Склад', icon: Package, roles: ['ADMIN', 'MANAGER'] },
    { id: 'templates', label: 'Шаблоны (Модели)', icon: ClipboardList, roles: ['ADMIN', 'MANAGER'] },
    { id: 'report', label: 'Отчет по Зарплате', icon: FileBarChart, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    { id: 'admin', label: 'Админ Панель', icon: ShieldCheck, roles: ['ADMIN'] },
  ] as const;

  const visibleItems = allNavItems.filter(item => (item.roles as readonly string[]).includes(user?.role || 'WORKER'));

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-20 md:w-64'} bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300 relative z-20 print:hidden`}>
      
      {/* Desktop Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-9 bg-slate-800 text-slate-400 hover:text-white w-6 h-6 rounded-full border border-slate-700 hidden md:flex items-center justify-center z-50 shadow-sm"
        title={isCollapsed ? "Развернуть" : "Свернуть"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800 overflow-hidden">
        <Scissors className="w-8 h-8 text-indigo-400 shrink-0" />
        <span className={`ml-3 font-bold text-lg transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'hidden md:block'}`}>
          ШвейЦех
        </span>
      </div>

      <div className={`px-4 py-4 flex items-center gap-3 border-b border-slate-800 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
         <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.charAt(0) || 'U'}
         </div>
         {!isCollapsed && (
             <div className="overflow-hidden">
                 <div className="text-sm font-medium truncate">{user?.name}</div>
                 <div className="text-xs text-slate-400 truncate lowercase">{user?.role}</div>
             </div>
         )}
      </div>

      <nav className="flex-1 py-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          // @ts-ignore
          const onClick = () => setPage(item.id);
          
          return (
            <button
              key={item.id}
              onClick={onClick}
              className={`w-full flex items-center px-4 md:px-6 py-3 hover:bg-slate-800 transition-colors relative group ${
                isActive ? 'bg-slate-800 border-r-4 border-indigo-500 text-white' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`ml-3 font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'hidden md:block'}`}>
                {item.label}
              </span>

              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700 whitespace-nowrap hidden md:block">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
            onClick={logout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} py-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition-colors`}
            title="Выйти"
        >
            <LogOut size={20} />
            {!isCollapsed && <span className="ml-3 font-medium">Выйти</span>}
        </button>
      </div>

      <div className={`p-4 text-xs text-slate-500 hidden md:block text-center transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
        {!isCollapsed && <span>v2.0.0 &copy; 2024</span>}
      </div>
    </aside>
  );
};