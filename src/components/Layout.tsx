import React from 'react';
import { FileText, Search, ShieldCheck, Settings, Home, Activity, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProcurement } from '@/store/procurementStore';

export function Layout({ children, currentPath = '/' }: { children: React.ReactNode; currentPath?: string }) {
  const { dispatch } = useProcurement();

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Activity, label: 'Novo Processo', path: '/process' },
    { icon: FileText, label: 'Documentos', path: '/docs' },
    { icon: Search, label: 'Pesquisa de Preços', path: '/prices' },
    { icon: ShieldCheck, label: 'Auditoria', path: '/audit' },
    { icon: List, label: 'Logs', path: '/logs' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (path === '/process') {
      dispatch({ type: 'RESET' });
    }
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            CP
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">GovProcure AI</h1>
            <p className="text-xs text-slate-500">Apoio a Contratações</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
              S
            </div>
            <div>
              <p className="text-sm font-medium">Servidor Público</p>
              <p className="text-xs text-slate-500">Órgão: Ministério X</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
