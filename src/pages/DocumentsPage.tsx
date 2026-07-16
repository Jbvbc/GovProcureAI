import React from 'react';
import { Layout } from '@/components/Layout';
import { useProcurement } from '@/store/procurementStore';
import { FileText, FileDown, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { documentService } from '@/services/documentService';
import { cn } from '@/lib/utils';

export function DocumentsPage() {
  const { state } = useProcurement();

  const documents = [
    { id: 'dfd', title: 'Documento de Formalização de Demanda (DFD)', data: state.dfd },
    { id: 'etp', title: 'Estudo Técnico Preliminar (ETP)', data: state.etp },
    { id: 'priceResearch', title: 'Pesquisa de Preços', data: state.priceResearch },
    { id: 'tr', title: 'Termo de Referência (TR)', data: state.tr },
    { id: 'audit', title: 'Relatório de Auditoria', data: state.audit },
  ];

  const handleExport = (content: string, title: string) => {
    documentService.exportToDocx(content, title.replace(/\s+/g, '_'));
  };

  return (
    <Layout currentPath="/docs">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Repositório de Documentos</h1>
          <p className="text-slate-500 mt-1">Visualize e exporte todos os documentos gerados no processo atual.</p>
        </div>

        <div className="grid gap-4">
          {documents.map((doc) => {
            const hasContent = doc.data.content.length > 0;
            const isApproved = doc.data.status === 'approved';

            return (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    hasContent ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                        isApproved ? "bg-emerald-100 text-emerald-700" : 
                        hasContent ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {isApproved ? (
                          <><CheckCircle2 className="w-3 h-3" /> Aprovado</>
                        ) : hasContent ? (
                          <><Clock className="w-3 h-3" /> Em Revisão</>
                        ) : (
                          <><AlertCircle className="w-3 h-3" /> Pendente</>
                        )}
                      </span>
                      {hasContent && (
                        <span className="text-xs text-slate-400">
                          {doc.data.content.length} caracteres
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasContent ? (
                    <>
                      <button
                        onClick={() => handleExport(doc.data.content, doc.title)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                        Exportar DOCX
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 italic px-4">Aguardando geração</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {state.demand.object === '' && (
          <div className="mt-12 p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum processo ativo</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">Inicie uma nova contratação para começar a gerar documentos automaticamente com IA.</p>
            <button
              onClick={() => window.history.pushState({}, '', '/process')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Iniciar Novo Processo
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { Activity } from 'lucide-react';
