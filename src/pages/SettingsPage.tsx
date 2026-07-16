import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useProcurement, UploadedDocument } from '@/store/procurementStore';
import { Settings, Save, AlertCircle, Building2, BookOpen, Upload, X, FileText, Globe } from 'lucide-react';

export function SettingsPage() {
  const { state, dispatch } = useProcurement();
  const [organizationName, setOrganizationName] = useState('');
  const [customLawsData, setCustomLawsData] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.legislation) {
      setOrganizationName(state.legislation.organizationName || '');
      setCustomLawsData(state.legislation.customLawsData || '');
      setUploadedDocuments(state.legislation.uploadedDocuments || []);
      setEnableSearchGrounding(state.legislation.enableSearchGrounding || false);
    }
  }, [state.legislation]);

  const handleSave = () => {
    dispatch({
      type: 'SET_LEGISLATION',
      payload: {
        organizationName,
        customLawsData,
        uploadedDocuments,
        enableSearchGrounding,
      },
    });
    dispatch({ type: 'ADD_LOG', payload: { action: 'Configurações de legislação atualizadas.' } });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs: UploadedDocument[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove the "data:application/pdf;base64," prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });

        newDocs.push({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            data: base64Data,
        });
    }

    setUploadedDocuments(prev => [...prev, ...newDocs]);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeDocument = (id: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== id));
  };


  return (
    <Layout currentPath="/settings">
      <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" /> Configurações Institucionais
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Configure as normativas, decretos e a identidade do seu órgão para que a Inteligência Artificial as utilize na elaboração e auditoria dos documentos padrão.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" /> Identificação do Órgão
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome da Instituição/Prefeitura
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Ex: Prefeitura Municipal de Bom Jesus do Camboriú"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-500 mt-2">
                O nome informado aqui será usado no cabeçalho e referenciado nos documentos gerados.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    Ancoragem com Busca do Google (Search Grounding)
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Permite que a Inteligência Artificial consulte a internet em tempo real (Google Search) ao elaborar ou auditar seus documentos. Ideal para encontrar decretos municipais atualizados, leis específicas ou referências de preços recentes no Portal Nacional de Contratações Públicas (PNCP).
                  </p>
                </div>
              </div>
              <div className="flex items-center h-6">
                <input
                  id="search-grounding-toggle"
                  type="checkbox"
                  checked={enableSearchGrounding}
                  onChange={(e) => setEnableSearchGrounding(e.target.checked)}
                  className="w-10 h-5 bg-gray-200 rounded-full appearance-none cursor-pointer relative before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] before:transition-all checked:bg-blue-600 checked:before:translate-x-5 transition-colors border border-slate-300"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <span className="font-semibold">Modelo ativo:</span> Quando habilitado, o sistema instruirá o modelo <span className="font-semibold font-mono">gemini-3.1-pro-preview / gemini-2.5-flash / gemini-2.0-flash</span> a realizar pesquisas ao vivo no Google e citar as fontes em notas de rodapé ou referências bibliográficas.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" /> Legislação e Normativas Locais
            </h2>
            <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Contexto da IA</p>
                <p>Por padrão, a IA obedece à Lei Federal nº 14.133/2021. Caso seu município ou órgão tenha decretos municipais regulamentadores ou Instruções Normativas específicas (substituindo a IN 58 ou IN 65, por exemplo), relacione-as abaixo.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descreva suas normativas e exigências (texto livre)
              </label>
              <textarea
                rows={8}
                value={customLawsData}
                onChange={(e) => setCustomLawsData(e.target.value)}
                placeholder="Ex: Utilizar o Decreto Municipal nº 123/2023 que regulamenta a Lei 14.133/2021 no âmbito municipal. Para pesquisa de preços, seguir a Instrução Normativa Municipal nº 04/2023, que prioriza a pesquisa com fornecedores locais..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-mono text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Anexar Decretos ou INs Locais (PDF, TXT, DOCX)
              </label>
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="legislation-upload"
                />
                <label
                  htmlFor="legislation-upload"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivos
                </label>
                <span className="text-xs text-slate-500">
                  Os arquivos serão lidos e anexados ao contexto da Inteligência Artificial em suas solicitações.
                  Limite de armazenamento no navegador. Para arquivos muito grandes, os dados podem não ser salvos após atualizar a página.
                </span>
              </div>

              {uploadedDocuments.length > 0 && (
                <div className="space-y-2">
                  {uploadedDocuments.map(doc => (
                     <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                           <FileText className="w-5 h-5 text-blue-500" />
                           <div>
                              <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                              <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                           </div>
                        </div>
                        <button
                           onClick={() => removeDocument(doc.id)}
                           className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                           title="Remover documento"
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <div className="flex items-center gap-4">
              {isSaved && (
                <span className="text-sm font-medium text-emerald-600 transition-opacity">
                  Configurações salvas com sucesso!
                </span>
              )}
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" /> Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
