import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useProcurement } from '@/store/procurementStore';
import { Search, FileDown, AlertTriangle, CheckCircle2, Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { documentService } from '@/services/documentService';
import Markdown from 'react-markdown';
import { aiService } from '@/services/aiService';

export function PriceResearchPage() {
  const { state } = useProcurement();
  const processResearch = state.priceResearch;

  const [standaloneResult, setStandaloneResult] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [objectDesc, setObjectDesc] = useState('');
  const [items, setItems] = useState([{ id: '1', description: '', quantity: 1, unit: 'UN' }]);

  const activeContent = processResearch.content || standaloneResult;

  const handleExport = () => {
    documentService.exportToDocx(activeContent, 'Pesquisa_de_Precos');
  };

  const handleAddItem = () => {
    setItems([...items, { id: String(items.length + 1), description: '', quantity: 1, unit: 'UN' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Re-index
    setItems(newItems.map((item, i) => ({ ...item, id: String(i + 1) })));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleStandaloneSearch = async () => {
    if (!objectDesc.trim() || items.some(i => !i.description.trim())) {
      alert('Por favor, preencha o objeto da contratação e a descrição de todos os itens.');
      return;
    }

    setIsSearching(true);
    try {
      const demandData = { object: objectDesc };
      const result = await aiService.performPriceResearch(demandData, items, state.legislation);
      setStandaloneResult(result);
    } catch (error) {
      console.error(error);
      alert('Erro ao realizar pesquisa de preços. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearStandalone = () => {
    setStandaloneResult('');
  };

  return (
    <Layout currentPath="/prices">
      <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Módulo de Pesquisa de Preços</h1>
            <p className="text-slate-500 mt-1">Consulta automatizada ao PNCP conforme IN 65/2021.</p>
          </div>
          <div className="flex gap-3">
            {standaloneResult && !processResearch.content && (
              <button
                onClick={handleClearStandalone}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Nova Pesquisa Avulsa
              </button>
            )}
            {activeContent && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Exportar DOCX
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {activeContent ? (
            <div className="p-8 overflow-auto prose prose-slate max-w-none prose-table:w-full prose-th:bg-slate-100 prose-th:p-3 prose-td:p-3 prose-td:border-b prose-td:border-slate-200">
              <div className="flex items-center gap-2 mb-6 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Pesquisa realizada com sucesso via API do PNCP.</span>
              </div>
              <Markdown>{activeContent}</Markdown>
            </div>
          ) : (
            <div className="p-8 flex-1 overflow-auto">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Pesquisa de Preços Avulsa</h2>
                    <p className="text-sm text-slate-500">Realize uma pesquisa direta no PNCP sem precisar criar um processo completo.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Objeto da Contratação
                    </label>
                    <textarea
                      value={objectDesc}
                      onChange={(e) => setObjectDesc(e.target.value)}
                      placeholder="Ex: Aquisição de materiais de expediente para a Secretaria de Administração..."
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Itens a Pesquisar
                      </label>
                      <button
                        onClick={handleAddItem}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="w-12 pt-2 text-center font-medium text-slate-500">
                            {item.id}
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Descrição detalhada do item (Ex: Papel A4 75g/m² branco)"
                              className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                            />
                            <div className="flex gap-3">
                              <div className="w-1/3">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                  placeholder="Qtd"
                                  className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                              <div className="w-1/3">
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                  placeholder="Unidade (ex: UN, PCT)"
                                  className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          {items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={handleStandaloneSearch}
                      disabled={isSearching}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Realizando Pesquisa no PNCP (Isso pode levar alguns minutos)...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Pesquisar no PNCP
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeContent && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Aviso de Conformidade Legal</p>
              <p className="mt-1">Esta pesquisa foi extraída de bases oficiais (PNCP). Certifique-se de que os itens correspondem exatamente à sua necessidade antes de homologar o Mapa de Preços.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
