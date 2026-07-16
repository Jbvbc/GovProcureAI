import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useProcurement } from '@/store/procurementStore';
import { aiService } from '@/services/aiService';
import { documentService } from '@/services/documentService';
import Markdown from 'react-markdown';
import { CheckCircle2, Circle, Loader2, FileDown, AlertTriangle, ArrowRight, ArrowLeft, FileText, Search, ShieldCheck, RefreshCw, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Pesquisa', desc: 'Itens e Preços' },
  { id: 2, title: 'Demanda', desc: 'Dados iniciais' },
  { id: 3, title: 'DFD', desc: 'Formalização' },
  { id: 4, title: 'ETP', desc: 'Estudo Técnico' },
  { id: 5, title: 'TR', desc: 'Termo de Referência' },
  { id: 6, title: 'Auditoria', desc: 'Conformidade legal' },
];

export function ProcessFlow() {
  const { state, dispatch } = useProcurement();

  return (
    <Layout currentPath="/process">
      <div className="flex h-full flex-col">
        {/* Header / Stepper */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Nova Contratação</h1>
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja reiniciar o processo? Todos os dados não salvos serão perdidos.')) {
                  dispatch({ type: 'RESET' });
                }
              }}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar Processo
            </button>
          </div>
          <div className="flex items-center justify-between max-w-4xl">
            {STEPS.map((step, idx) => {
              const isActive = state.currentStep === step.id;
              const isPast = state.currentStep > step.id;
              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                    isActive ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-100" :
                    isPast ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={cn("text-sm font-medium", isActive ? "text-blue-700" : isPast ? "text-slate-700" : "text-slate-400")}>{step.title}</p>
                    <p className="text-xs text-slate-400 hidden md:block">{step.desc}</p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      "absolute top-5 left-10 w-[calc(100%+2rem)] h-0.5 -z-10",
                      isPast ? "bg-emerald-500" : "bg-slate-200"
                    )} style={{ width: '150px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
            {state.currentStep === 1 && <StepPriceResearch />}
            {state.currentStep === 2 && <StepDemand />}
            {state.currentStep === 3 && <StepDocument docType="dfd" title="Documento de Formalização de Demanda (DFD)" />}
            {state.currentStep === 4 && <StepDocument docType="etp" title="Estudo Técnico Preliminar (ETP)" />}
            {state.currentStep === 5 && <StepDocument docType="tr" title="Termo de Referência (TR)" />}
            {state.currentStep === 6 && <StepAudit />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StepDemand() {
  const { state, dispatch } = useProcurement();
  const [formData, setFormData] = useState(state.demand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_DEMAND', payload: formData });
    dispatch({ type: 'SET_STEP', payload: 3 });
    dispatch({ type: 'ADD_LOG', payload: { action: 'Demanda registrada' } });
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dados da Demanda</h2>
          <p className="text-sm text-slate-500 mt-1">Preencha os dados básicos para iniciar o processo. A IA utilizará essas informações para gerar os documentos.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Objeto da Contratação *</label>
            <input
              required
              type="text"
              value={formData.object}
              onChange={e => setFormData({ ...formData, object: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ex: Aquisição de 50 notebooks corporativos..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as 'material' | 'service' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="material">Material / Equipamento</option>
                <option value="service">Serviço</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Justificativa da Necessidade *</label>
            <textarea
              required
              rows={5}
              value={formData.justification}
              onChange={e => setFormData({ ...formData, justification: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Descreva por que esta contratação é necessária para a Administração Pública..."
            />
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> A IA expandirá esta justificativa com base na Lei 14.133/2021.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-center">
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 })}
          className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          Avançar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

function StepDocument({ docType, title }: { docType: 'dfd' | 'etp' | 'tr'; title: string }) {
  const { state, dispatch } = useProcurement();
  const docData = state[docType];
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: docType, content: '', status: 'generating' } });

    try {
      let content = '';
      if (docType === 'dfd') {
        content = await aiService.generateDFD(state.demand, state.items, state.priceResearch.content, state.legislation);
      } else if (docType === 'etp') {
        content = await aiService.generateETP(state.demand, state.items, state.dfd.content, state.legislation);
      } else if (docType === 'tr') {
        content = await aiService.generateTR(state.demand, state.items, state.etp.content, state.priceResearch.content, state.legislation);
      }

      dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: docType, content, status: 'reviewing' } });
      dispatch({ type: 'ADD_LOG', payload: { action: `${docType.toUpperCase()} gerado pela IA` } });
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar documento');
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: docType, content: '', status: 'pending' } });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: docType, content: docData.content, status: 'approved' } });
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    dispatch({ type: 'ADD_LOG', payload: { action: `${docType.toUpperCase()} aprovado pelo usuário` } });
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    if (format === 'docx') documentService.exportToDocx(docData.content, `${docType.toUpperCase()}_Documento`);
    if (format === 'pdf') documentService.exportToPdf(docData.content, `${docType.toUpperCase()}_Documento`);
  };

  return (
    <div className="p-8 flex-1 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">Geração assistida por IA baseada na Lei 14.133/2021</p>
        </div>
        {(docData.status === 'reviewing' || docData.status === 'approved') && (
          <div className="flex gap-2">
            <button onClick={() => handleExport('docx')} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors" title="Exportar DOCX">
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden flex flex-col relative min-h-[400px]">
        {docData.status === 'pending' && !isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Pronto para gerar</h3>
            <p className="text-slate-500 max-w-md mb-6">A IA utilizará os dados da demanda e o contexto jurídico para redigir o documento completo.</p>
            <button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Gerar Documento com IA
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Analisando legislação e redigindo...</h3>
            <p className="text-slate-500 max-w-md">Isso pode levar alguns segundos. A IA está garantindo a conformidade com a Lei 14.133/2021.</p>
          </div>
        )}

        {(docData.status === 'reviewing' || docData.status === 'approved') && (
          <div className="flex-1 overflow-auto p-6 bg-white prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-700 prose-p:leading-relaxed">
            <Markdown>{docData.content}</Markdown>
          </div>
        )}
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-center">
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 })}
          className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        
        {(docData.status === 'reviewing' || docData.status === 'approved') && (
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Regerar
            </button>
            <button
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              Aprovar e Avançar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepPriceResearch() {
  const { state, dispatch } = useProcurement();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [objectName, setObjectName] = useState(state.demand.object);
  const [file, setFile] = useState<File | null>(null);
  const [researchFile, setResearchFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const researchFileInputRef = useRef<HTMLInputElement>(null);

  // Reset local state when the global state is reset (e.g., "Novo Processo")
  useEffect(() => {
    if (state.priceResearch.status === 'pending' && state.demand.object === '') {
      setObjectName('');
      setFile(null);
      setResearchFile(null);
      setIsGenerating(false);
      setError('');
    }
  }, [state.priceResearch.status, state.demand.object]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleResearchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResearchFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearResearchFile = () => {
    setResearchFile(null);
    if (researchFileInputRef.current) {
      researchFileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!objectName) {
      setError('Por favor, informe o Objeto da Contratação.');
      return;
    }

    setIsGenerating(true);
    setError('');
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'priceResearch', content: '', status: 'generating' } });

    try {
      // 1. Update demand object
      const updatedDemand = { ...state.demand, object: objectName };
      dispatch({ type: 'SET_DEMAND', payload: updatedDemand });

      let content = '';

      // CASE A: User provided an external price research file
      if (researchFile) {
        dispatch({ type: 'ADD_LOG', payload: { action: 'Processando pesquisa de preços externa...' } });
        const reader = new FileReader();
        const fileData = await new Promise<{ data: string, mimeType: string, name: string }>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ data: base64, mimeType: researchFile.type, name: researchFile.name });
          };
          reader.onerror = reject;
          reader.readAsDataURL(researchFile);
        });

        content = await aiService.extractPriceResearchFromFile(fileData);
        
        // Also extract items to keep the state consistent
        const extractedItems = await aiService.extractItemsFromFile(fileData);
        dispatch({ type: 'SET_ITEMS', payload: extractedItems });
        dispatch({ type: 'ADD_LOG', payload: { action: 'Dados e itens extraídos da pesquisa externa.' } });
      } 
      // CASE B: Automated search or item extraction
      else {
        let extractedItems = state.items;
        if (file) {
          dispatch({ type: 'ADD_LOG', payload: { action: 'Extraindo itens do arquivo anexo...' } });
          const reader = new FileReader();
          const fileData = await new Promise<{ data: string, mimeType: string, name: string }>((resolve, reject) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({ data: base64, mimeType: file.type, name: file.name });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          extractedItems = await aiService.extractItemsFromFile(fileData);
          dispatch({ type: 'SET_ITEMS', payload: extractedItems });
          dispatch({ type: 'ADD_LOG', payload: { action: `Foram extraídos ${extractedItems.length} itens do arquivo.` } });
        }

        dispatch({ type: 'ADD_LOG', payload: { action: 'Iniciando pesquisa de preços no PNCP...' } });
        content = await aiService.performPriceResearch(updatedDemand, extractedItems, state.legislation);
      }

      dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'priceResearch', content, status: 'reviewing' } });
      dispatch({ type: 'ADD_LOG', payload: { action: 'Pesquisa de preços concluída' } });
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar pesquisa');
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'priceResearch', content: '', status: 'pending' } });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'priceResearch', content: state.priceResearch.content, status: 'approved' } });
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
  };

  return (
    <div className="p-8 flex-1 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Itens e Pesquisa de Preços</h2>
          <p className="text-sm text-slate-500 mt-1">Defina o objeto, anexe a lista de itens e busque preços reais no PNCP, Atas e Contratos (IN 65/2021)</p>
        </div>
        {(state.priceResearch.status === 'reviewing' || state.priceResearch.status === 'approved') && (
          <div className="flex gap-2">
            <button onClick={() => documentService.exportToDocx(state.priceResearch.content, 'Pesquisa_de_Precos')} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors" title="Exportar DOCX">
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden flex flex-col relative min-h-[400px]">
        {state.priceResearch.status === 'pending' && !isGenerating && (
          <div className="flex-1 flex flex-col p-8">
            <div className="space-y-6 max-w-2xl mx-auto w-full">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Objeto da Contratação *</label>
                <input
                  required
                  type="text"
                  value={objectName}
                  onChange={e => setObjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Aquisição de material elétrico..."
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">Como deseja realizar a pesquisa?</label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div 
                    onClick={() => setResearchFile(null)}
                    className={cn(
                      "p-4 border-2 rounded-xl cursor-pointer transition-all",
                      !researchFile ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("p-2 rounded-lg", !researchFile ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
                        <Search className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">Busca Automatizada</span>
                    </div>
                    <p className="text-xs text-slate-500">O robô busca preços reais no PNCP, Atas e Contratos automaticamente.</p>
                  </div>

                  <div 
                    onClick={() => researchFileInputRef.current?.click()}
                    className={cn(
                      "p-4 border-2 rounded-xl cursor-pointer transition-all",
                      researchFile ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("p-2 rounded-lg", researchFile ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">Upload de Pesquisa Externa</span>
                    </div>
                    <p className="text-xs text-slate-500">Envie sua própria planilha ou PDF de preços para instruir o robô.</p>
                    <input
                      ref={researchFileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleResearchFileChange}
                      accept=".pdf,.csv,.xlsx,.docx,.txt"
                    />
                  </div>
                </div>

                {!researchFile ? (
                  <div className="space-y-4 p-4 bg-slate-100 rounded-xl border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Anexar Lista de Itens (Opcional)</label>
                    <p className="text-xs text-slate-500 mb-2">Envie um arquivo com a relação de itens para a busca automatizada.</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        Selecionar Arquivo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.csv,.txt"
                      />
                      {file && (
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
                          <span className="text-xs font-medium text-emerald-700 truncate max-w-[150px]">{file.name}</span>
                          <button onClick={handleClearFile} className="text-emerald-500 hover:text-emerald-700"><X className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">Arquivo de Pesquisa Selecionado</p>
                          <p className="text-xs text-blue-700">{researchFile.name}</p>
                        </div>
                      </div>
                      <button onClick={handleClearResearchFile} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleGenerate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
                >
                  {researchFile ? <FileText className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  {researchFile ? "Processar Pesquisa Externa" : "Extrair Itens e Pesquisar Preços"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Processando...</h3>
            <p className="text-slate-500 max-w-md">Analisando documentos, extraindo itens e realizando busca profunda de preços reais no PNCP (Editais, Atas e Contratos).</p>
          </div>
        )}

        {(state.priceResearch.status === 'reviewing' || state.priceResearch.status === 'approved') && (
          <div className="flex-1 overflow-auto p-6 bg-white prose prose-slate max-w-none prose-table:w-full prose-th:bg-slate-100 prose-th:p-3 prose-td:p-3 prose-td:border-b prose-td:border-slate-200">
            <Markdown>{state.priceResearch.content}</Markdown>
          </div>
        )}
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end items-center">
        {(state.priceResearch.status === 'reviewing' || state.priceResearch.status === 'approved') && (
          <div className="flex gap-3">
            <button
              onClick={() => dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'priceResearch', content: '', status: 'pending' } })}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Refazer Busca
            </button>
            <button
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              Aprovar Preços e Avançar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepAudit() {
  const { state, dispatch } = useProcurement();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'audit', content: '', status: 'generating' } });

    try {
      const content = await aiService.auditProcess(state.demand, state.dfd.content, state.etp.content, state.tr.content, state.priceResearch.content, state.legislation);
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'audit', content, status: 'reviewing' } });
      dispatch({ type: 'ADD_LOG', payload: { action: 'Auditoria automática concluída' } });
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar auditoria');
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { doc: 'audit', content: '', status: 'pending' } });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 flex-1 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Auditoria Automática</h2>
          <p className="text-sm text-slate-500 mt-1">Verificação de conformidade com a Lei 14.133/2021 e TCU</p>
        </div>
        {state.audit.status === 'reviewing' && (
          <div className="flex gap-2">
            <button 
              onClick={() => documentService.exportToDocx(state.audit.content, 'Relatorio_Auditoria')} 
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors" 
              title="Exportar DOCX"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden flex flex-col relative min-h-[400px]">
        {state.audit.status === 'pending' && !isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Pronto para Auditoria</h3>
            <p className="text-slate-500 max-w-md mb-6">A IA analisará todos os documentos gerados em busca de inconsistências, riscos ou falta de fundamentação legal.</p>
            <button
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Iniciar Auditoria
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Analisando processo...</h3>
            <p className="text-slate-500 max-w-md">Cruzando dados com a jurisprudência do TCU e exigências da Lei 14.133/2021.</p>
          </div>
        )}

        {state.audit.status === 'reviewing' && (
          <div className="flex-1 overflow-auto p-6 bg-white prose prose-slate max-w-none prose-h3:text-indigo-700">
            <Markdown>{state.audit.content}</Markdown>
          </div>
        )}
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-center">
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 })}
          className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        
        {state.audit.status === 'reviewing' && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                alert('Processo finalizado com sucesso! Todos os documentos estão prontos para assinatura.');
                window.location.href = '/';
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              Finalizar Processo <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
