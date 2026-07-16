import React from 'react';
import { Layout } from '@/components/Layout';
import { useProcurement } from '@/store/procurementStore';
import { ShieldCheck, FileDown, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { documentService } from '@/services/documentService';
import Markdown from 'react-markdown';
import { cn } from '@/lib/utils';

export function AuditPage() {
  const { state, dispatch } = useProcurement();
  const audit = state.audit;

  const handleExport = () => {
    documentService.exportToDocx(audit.content, 'Relatorio_Auditoria');
  };

  return (
    <Layout currentPath="/audit">
      <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Módulo de Auditoria Automática</h1>
            <p className="text-slate-500 mt-1">Verificação de conformidade com a Lei 14.133/2021 e TCU.</p>
          </div>
          {audit.content && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Exportar DOCX
            </button>
          )}
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {audit.content ? (
            <div className="p-8 overflow-auto prose prose-slate max-w-none prose-h3:text-indigo-700">
              <div className="flex items-center gap-2 mb-6 p-3 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-medium">Auditoria concluída com base nos documentos gerados.</span>
              </div>
              <Markdown>{audit.content}</Markdown>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma auditoria ativa</h3>
              <p className="text-slate-500 max-w-md mb-8">Para realizar uma auditoria automática, você deve primeiro gerar os documentos do processo (DFD, ETP, TR).</p>
              <button
                onClick={() => window.history.pushState({}, '', '/process')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Ir para Novo Processo
              </button>
            </div>
          )}
        </div>

        {audit.content && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-800">
              <p className="font-semibold">Certificação de Auditoria</p>
              <p className="mt-1">Este relatório é gerado por IA com base na legislação vigente. Revise as recomendações antes de prosseguir com a publicação do edital.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
