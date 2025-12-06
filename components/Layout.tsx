import React from 'react';
import { BookOpen, LogOut, LayoutGrid } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  onLogout?: () => void;
  user?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, showNav = true, onLogout, user }) => {
  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${!showNav ? 'bg-slate-900' : 'bg-[#f8fafc]'}`}>
      {showNav && (
        <header className="sticky top-0 z-50 no-print px-4 py-4">
          <div className="glass-panel rounded-2xl container mx-auto px-6 py-3 flex items-center justify-between shadow-lg shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2.5 rounded-xl text-white shadow-lg shadow-brand-500/20 transform hover:scale-105 transition-transform duration-300">
                <BookOpen size={26} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">مُعِــد</h1>
                <span className="text-[10px] font-bold text-brand-600 tracking-wider mt-0.5 uppercase opacity-80">Exam Master AI</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800">{user}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">حساب معلم</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                <button 
                  onClick={onLogout}
                  className="group p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 border border-transparent hover:border-red-100"
                  title="تسجيل خروج"
                >
                  <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </header>
      )}
      
      <main className={`flex-grow container mx-auto px-4 ${showNav ? 'py-8' : 'py-0'} relative z-10`}>
        {children}
      </main>
      
      {showNav && (
        <footer className="py-8 text-center text-slate-400 text-xs font-medium no-print">
          <p className="flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <LayoutGrid size={14} />
            جميع الحقوق محفوظة لمنصة معد © {new Date().getFullYear()}
          </p>
        </footer>
      )}
    </div>
  );
};

export default Layout;