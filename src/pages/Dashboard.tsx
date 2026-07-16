import React from 'react';
import { Layout } from '@/components/Layout';
import { FilePlus, Clock, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import { useProcurement } from '@/store/procurementStore';

export function Dashboard() {
  const { dispatch } = useProcurement();

  const handleNewProcess = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: 'RESET' });
    window.history.pushState({}, '', '/process');
    // Trigger a popstate event to notify App.tsx of the route change
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <Layout currentPath="/">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 mt-2">Bem-vindo ao Sistema de Apoio às Contratações Públicas.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <FilePlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Processos Ativos</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">12</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Aguardando Revisão</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">4</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Concluídos (Mês)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">28</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Alertas de Auditoria</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">2</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900">Processos Recentes</h2>
              <a 
                href="/process" 
                onClick={handleNewProcess}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Novo Processo
              </a>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { id: '2023/001', obj: 'Aquisição de Computadores', status: 'ETP em elaboração', date: 'Hoje' },
                { id: '2023/002', obj: 'Serviço de Limpeza', status: 'Aguardando TR', date: 'Ontem' },
                { id: '2023/003', obj: 'Material de Expediente', status: 'Pesquisa de Preços', date: '2 dias atrás' },
              ].map((proc) => (
                <div key={proc.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">{proc.id}</span>
                      <h3 className="font-medium text-slate-900">{proc.obj}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Status: {proc.status}</p>
                  </div>
                  <span className="text-sm text-slate-400">{proc.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Ações Rápidas</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              <a 
                href="/process" 
                onClick={handleNewProcess}
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-md group-hover:bg-blue-200">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Iniciar Nova Contratação</h4>
                  <p className="text-xs text-slate-500">Assistente guiado por IA</p>
                </div>
              </a>
              <button 
                onClick={() => window.location.href = '/prices'}
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
              >
                <div className="p-2 bg-slate-100 text-slate-600 rounded-md">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Pesquisa de Preços Avulsa</h4>
                  <p className="text-xs text-slate-500">Consulta PNCP e Compras.gov</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
