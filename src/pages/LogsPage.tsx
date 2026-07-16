import React from 'react';
import { Layout } from '@/components/Layout';
import { useProcurement } from '@/store/procurementStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function LogsPage() {
  const { state } = useProcurement();

  return (
    <Layout currentPath="/logs">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Logs e Rastreabilidade</h1>
          <p className="text-slate-500 mt-2">Histórico completo de ações e interações com a IA.</p>
        </header>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {state.logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhum log registrado ainda. Inicie um novo processo para gerar histórico.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {state.logs.map((log, index) => (
                <div key={index} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">{log.action}</p>
                    {log.details && <p className="text-sm text-slate-600 mt-1">{log.details}</p>}
                    <p className="text-xs text-slate-400 mt-2">
                      {format(new Date(log.timestamp), "dd 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
