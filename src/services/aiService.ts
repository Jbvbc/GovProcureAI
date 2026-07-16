import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
Você é um Agente de IA Especialista em Contratações Públicas no Brasil.
Sua função é atuar como um Sistema Completo de Apoio às Contratações Públicas, auxiliando servidores na elaboração de documentos e auditoria de processos licitatórios.

DIRETRIZES OBRIGATÓRIAS:
1. BASE LEGAL: Suas respostas e documentos gerados DEVEM ser estritamente baseados na Lei 14.133/2021 (Nova Lei de Licitações e Contratos), Decreto 11.209/2023, Instruções Normativas da SEGES/MGI (ex: IN 58/2022, IN 65/2021) e Jurisprudência do TCU.
2. FORMALIDADE: Utilize linguagem formal, técnica e jurídica adequada à Administração Pública.
3. NÃO INVENTE DADOS: Se faltarem informações essenciais, solicite-as ou utilize espaços reservados (ex: [INSERIR NOME DO ÓRGÃO]). Não crie fatos, preços irreais ou justificativas infundadas.
4. CITAÇÃO LEGAL: Sempre cite os artigos e incisos da legislação pertinente ao fundamentar suas análises ou gerar documentos.
5. OBJETIVIDADE: Seja claro, conciso e direto, evitando jargões desnecessários fora do contexto jurídico.

Você atuará em diferentes fases do processo:
- Fase 1: Geração do Documento de Formalização de Demanda (DFD).
- Fase 2: Geração do Estudo Técnico Preliminar (ETP).
- Fase 3: Pesquisa de Preços (simulação baseada em dados reais ou busca).
- Fase 4: Geração do Termo de Referência (TR).
- Fase 5: Auditoria de Conformidade Legal.
`;

export const aiService = {
  _buildContentsWithDocuments(prompt: string, uploadedDocs?: any[]) {
    const contents: any[] = [prompt];
    
    if (uploadedDocs && uploadedDocs.length > 0) {
      for (const doc of uploadedDocs) {
        if (doc.data) {
          contents.push({
            inlineData: {
              data: doc.data,
              mimeType: doc.type || 'text/plain'
            }
          });
        }
      }
    }
    
    return contents;
  },

  async extractItemsFromFile(fileData: { data: string, mimeType: string, name: string }) {
    const prompt = `
      Analise o documento em anexo e extraia a lista de itens que precisam ser adquiridos/contratados.
      Retorne a lista de itens com id, descrição detalhada, quantidade e unidade de medida.
    `;

    const mimeType = fileData.mimeType === 'application/csv' ? 'text/csv' : fileData.mimeType;

    const contents: any[] = [
      prompt,
      {
        inlineData: {
          data: fileData.data,
          mimeType: mimeType
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Identificador ou número do item" },
              description: { type: Type.STRING, description: "Descrição detalhada e especificações do item" },
              quantity: { type: Type.NUMBER, description: "Quantidade a ser adquirida" },
              unit: { type: Type.STRING, description: "Unidade de medida (ex: UN, CX, KG)" }
            },
            required: ["id", "description", "quantity", "unit"]
          }
        }
      },
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse items JSON", e);
      return [];
    }
  },

  async extractPriceResearchFromFile(fileData: { data: string, mimeType: string, name: string }) {
    const prompt = `
      Analise o documento de pesquisa de preços em anexo.
      Sua tarefa é extrair os dados consolidados da pesquisa de preços para que possamos usar como fonte oficial nos próximos documentos (DFD, ETP, TR).
      
      Extraia:
      1. A lista de itens com suas quantidades e unidades.
      2. O valor de referência (estimado) para cada item.
      3. As fontes/fornecedores citados (se houver).
      
      Gere um Relatório de Pesquisa de Preços em Markdown seguindo rigorosamente o modelo profissional que estabelecemos (inspirado no modelo de Balneário Camboriú), contendo:
      - Descrição do Objeto
      - Metodologia (mencione que os dados foram extraídos de documento externo fornecido pelo usuário)
      - Quadro Comparativo de Preços (com os dados extraídos)
      - Tabela de Valores de Referência (Consolidada)
      - Conclusão
      
      O conteúdo gerado deve ser um Markdown completo e pronto para ser usado como o documento de "Pesquisa de Preços" do sistema.
    `;

    const mimeType = fileData.mimeType === 'application/csv' ? 'text/csv' : fileData.mimeType;

    const contents: any[] = [
      prompt,
      {
        inlineData: {
          data: fileData.data,
          mimeType: mimeType
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
      },
    });

    return response.text;
  },

  async generateDFD(demandData: any, items: any[], priceResearchContent?: string, legislationConfig?: any) {
    const orgInfo = legislationConfig?.organizationName ? `ÓRGÃO: ${legislationConfig.organizationName}\n` : '';
    const customLaws = legislationConfig?.customLawsData ? `LEGISLAÇÃO E NORMATIVAS ESPECÍFICAS A OBSERVAR:\n${legislationConfig.customLawsData}\n\nATENÇÃO: Você DEVE utilizar e citar explicitamente as normativas municipais/específicas acima em substituição ou complemento às normas federais gerais (como IN 65 e IN 58) quando aplicável.\n` : '';

    const prompt = `
      Com base nos dados fornecidos abaixo, gere um Documento de Formalização de Demanda (DFD) completo, em formato Markdown.
      
      ${orgInfo}
      ${customLaws}
      DADOS DA DEMANDA:
      - Objeto: ${demandData.object}
      - Justificativa da Necessidade: ${demandData.justification}
      - Tipo: ${demandData.type}
      
      ITENS DA CONTRATAÇÃO:
      ${JSON.stringify(items, null, 2)}
      
      ${priceResearchContent ? `PESQUISA DE PREÇOS (Use para a Estimativa Preliminar do Valor):\n${priceResearchContent}` : ''}
      
      ESTRUTURA ESPERADA DO DFD:
      1. Identificação do Setor Requisitante
      2. Justificativa da Necessidade da Contratação (expandir com base na justificativa fornecida e legislação aplicável)
      3. Descrição Sucinta do Objeto
      4. Quantidade a ser Contratada (Apresente em formato de tabela Markdown estruturada com Item, Descrição, Quantidade e Unidade)
      5. Estimativa Preliminar do Valor (Utilize os dados da pesquisa de preços fornecida para estimar o valor global, se disponível. Se não, indique que será detalhado na pesquisa de preços)
      6. Indicação dos Recursos Orçamentários (se houver)
      7. Alinhamento Estratégico (PCA - Plano de Contratações Anual)
      8. Assinaturas
      
      Gere apenas o conteúdo do documento em Markdown, sem introduções ou conclusões fora do documento.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: this._buildContentsWithDocuments(prompt, legislationConfig?.uploadedDocuments),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        tools: legislationConfig?.enableSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    return response.text;
  },

  async generateETP(demandData: any, items: any[], dfdContent: string, legislationConfig?: any) {
    const orgInfo = legislationConfig?.organizationName ? `ÓRGÃO: ${legislationConfig.organizationName}\n` : '';
    const customLaws = legislationConfig?.customLawsData ? `LEGISLAÇÃO E NORMATIVAS ESPECÍFICAS A OBSERVAR:\n${legislationConfig.customLawsData}\n\nATENÇÃO: Você DEVE utilizar e citar explicitamente as normativas municipais/específicas acima em substituição ou complemento às normas federais gerais (como IN 65 e IN 58) quando aplicável.\n` : '';

    const prompt = `
      Com base nos dados da demanda e no DFD aprovado, gere um Estudo Técnico Preliminar (ETP) completo, em formato Markdown.
      
      ${orgInfo}
      ${customLaws}
      DADOS DA DEMANDA:
      - Objeto: ${demandData.object}
      - Justificativa: ${demandData.justification}
      - Tipo: ${demandData.type}
      
      ITENS DA CONTRATAÇÃO:
      ${JSON.stringify(items, null, 2)}
      
      CONTEÚDO DO DFD:
      ${dfdContent}
      
      ESTRUTURA ESPERADA DO ETP (Elementos Obrigatórios e Opcionais recomendados):
      1. Descrição da Necessidade da Contratação
      2. Descrição dos Requisitos da Contratação
      3. Levantamento de Mercado (indicar que a pesquisa de preços detalhada ocorrerá na próxima fase, mas citar possíveis soluções)
      4. Descrição da Solução como um Todo
      5. Estimativa das Quantidades
      6. Estimativa do Valor da Contratação
      7. Justificativa para o Parcelamento ou não da Solução
      8. Contratações Correlatas e/ou Interdependentes
      9. Alinhamento entre a Contratação e o Planejamento
      10. Resultados Pretendidos
      11. Providências a serem Adotadas
      12. Impactos Ambientais e Medidas de Mitigação
      13. Declaração de Viabilidade
      
      Gere apenas o conteúdo do documento em Markdown, fundamentando juridicamente as escolhas com base nas normas aplicáveis fornecidas.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: this._buildContentsWithDocuments(prompt, legislationConfig?.uploadedDocuments),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        tools: legislationConfig?.enableSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    return response.text;
  },

  // ==========================================
  // BACKUP DA VERSÃO ANTERIOR DO MOTOR DE BUSCA (MANTER EM OFF CONFORME SOLICITAÇÃO)
  // ==========================================
  async performPriceResearchBackup_v1(demandData: any, items: any[], legislationConfig?: any) {
    const query = demandData.object;
    let allPrices: any[] = [];
    
    const fetchWithProxy = async (url: string) => {
      const proxyUrl = `/api/pncp-proxy?url=${encodeURIComponent(url)}`;
      return fetch(proxyUrl);
    };

    const fetchWithRetry = async (url: string, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetchWithProxy(url);
          if (res.ok) return res;
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      return null;
    };

    const fetchItemsAndResults = async (item: any, searchKeywords: string[], originalDescription: string, documentType: string, expectedUnit: string) => {
      const url = item.item_url || item.url;
      if (!url) return;

      const parts = url.split('/').filter(Boolean);
      let orgao_cnpj, ano, sequencial;

      if (parts.includes('orgaos') && parts.includes('compras')) {
        const orgaoIdx = parts.indexOf('orgaos');
        const comprasIdx = parts.indexOf('compras');
        orgao_cnpj = parts[orgaoIdx + 1];
        ano = parts[comprasIdx + 1];
        sequencial = parts[comprasIdx + 2];
      } else if (parts[0] === 'compras' || parts[0] === 'atas' || parts[0] === 'contratos') {
        orgao_cnpj = parts[1];
        ano = parts[2];
        sequencial = parts[3];
      } else if (parts.length >= 4) {
        orgao_cnpj = parts[parts.length - 3];
        ano = parts[parts.length - 2];
        sequencial = parts[parts.length - 1];
      }
      
      if (!orgao_cnpj || !ano || !sequencial) return;

      try {
        const itensRes = await fetchWithRetry(`https://pncp.gov.br/api/pncp/v1/orgaos/${orgao_cnpj}/compras/${ano}/${sequencial}/itens`);
        if (!itensRes) return;
        const pncpItens = await itensRes.json();
        
        const itemPromises = pncpItens.map(async (compraItem: any) => {
          const itemDesc = (compraItem.descricao || "").toLowerCase();
          const resultUnit = (compraItem.unidadeMedida || "").toLowerCase();
          
          // SCORE SYSTEM (Text + Unit)
          let textScore = 0;
          if (searchKeywords.length > 0) {
            const matchCount = searchKeywords.filter(k => itemDesc.includes(k.toLowerCase())).length;
            textScore = matchCount / searchKeywords.length;
          } else {
            textScore = 1;
          }

          let unitScore = 0.5; // Default neutral
          if (expectedUnit && resultUnit) {
            const expU = expectedUnit.toLowerCase();
            const resU = resultUnit.toLowerCase();
            if (expU === resU) unitScore = 1.0;
            else if (['m', 'metro', 'metros'].includes(expU) && ['m', 'metro', 'metros'].includes(resU)) unitScore = 1.0;
            else if (['un', 'und', 'unidade', 'unid'].includes(expU) && ['un', 'und', 'unidade', 'unid'].includes(resU)) unitScore = 1.0;
            else unitScore = 0.0; // Penalty for mismatch
          } else {
            unitScore = 0.8; // Slightly positive if missing
          }

          // Final Score: 70% Text, 30% Unit
          const finalScore = (textScore * 0.7) + (unitScore * 0.3);

          if (finalScore >= 0.6 && compraItem.temResultado) {
            try {
              const resultadosRes = await fetchWithRetry(`https://pncp.gov.br/api/pncp/v1/orgaos/${orgao_cnpj}/compras/${ano}/${sequencial}/itens/${compraItem.numeroItem}/resultados`);
              if (resultadosRes) {
                const resultados = await resultadosRes.json();
                if (resultados && resultados.length > 0) {
                  resultados.forEach((res: any) => {
                    if (allPrices.length < 300) { 
                      // LINKS OFICIAIS CORRIGIDOS DO PNCP (Busca inteligente com ID e fallbacks com preenchimento de zeros - zero-padding)
                      const docId = item.id || item.numeroControlePNCP || '';
                      
                      // Let's parse the parts from the control ID if available to ensure absolute accuracy
                      let parsedCnpj = orgao_cnpj;
                      let parsedAno = ano;
                      let parsedSeq = sequencial;
                      let parsedTipo = '1';
                      let parsedAtaSeq = '';
                      let parsedContratoSeq = '';

                      if (docId) {
                        // Deconstruct e.g. "76977768000181-1-000061/2026-000015"
                        const parts = docId.split('-');
                        if (parts.length >= 3) {
                          parsedCnpj = parts[0];
                          parsedTipo = parts[1];
                          const seqAndYear = parts[2].split('/');
                          if (seqAndYear.length === 2) {
                            parsedSeq = seqAndYear[0];
                            parsedAno = seqAndYear[1];
                          }
                          if (parts.length >= 4) {
                            parsedAtaSeq = parts[3];
                          }
                        } else if (docId.includes('/')) {
                          // Contrato e.g. "76977768000181-2-000015/2026"
                          const partsContrato = docId.split('-');
                          if (partsContrato.length >= 3) {
                            parsedCnpj = partsContrato[0];
                            parsedTipo = partsContrato[1];
                            const seqAndYear = partsContrato[2].split('/');
                            if (seqAndYear.length === 2) {
                              parsedContratoSeq = seqAndYear[0];
                              parsedAno = seqAndYear[1];
                            }
                          }
                        }
                      }

                      // Ensure correct padding if parsed sequence is numeric (6 digits is PNCP standard)
                      const padZero = (str: string, len = 6) => {
                        if (!str) return str;
                        const cleaned = str.trim();
                        if (/^\d+$/.test(cleaned)) {
                          return cleaned.padStart(len, '0');
                        }
                        return cleaned;
                      };

                      const seqPadded = padZero(parsedSeq);
                      const ataSeqPadded = padZero(parsedAtaSeq);
                      const contratoSeqPadded = padZero(parsedContratoSeq || parsedSeq);

                      let publicLink = '';
                      if (documentType === 'ata') {
                        if (docId) {
                          publicLink = `https://pncp.gov.br/app/atas?q=${encodeURIComponent(docId)}`;
                        } else {
                          publicLink = `https://pncp.gov.br/app/atas/${parsedCnpj}/${parsedAno}/${ataSeqPadded || seqPadded}`;
                        }
                      } else if (documentType === 'contrato') {
                        if (docId) {
                          publicLink = `https://pncp.gov.br/app/contratos?q=${encodeURIComponent(docId)}`;
                        } else {
                          publicLink = `https://pncp.gov.br/app/contratos/${parsedCnpj}/${parsedAno}/${contratoSeqPadded}`;
                        }
                      } else {
                        // Edital / Compra
                        if (docId) {
                          publicLink = `https://pncp.gov.br/app/editais?q=${encodeURIComponent(docId)}`;
                        } else {
                          publicLink = `https://pncp.gov.br/app/editais/${parsedTipo}/${parsedCnpj}/${parsedAno}/${seqPadded}`;
                        }
                      }

                      const priceValue = res.valorUnitarioHomologado || res.valorUnitarioEstimado || compraItem.valorUnitarioEstimado;
                      
                      if (priceValue > 0) {
                        allPrices.push({
                          source: `PNCP - ${item.orgao_nome || 'Órgão'}`,
                          supplier: res.nomeRazaoSocialFornecedor,
                          date: res.dataResultado,
                          price: priceValue,
                          description: compraItem.descricao,
                          searchedItem: originalDescription,
                          unit: compraItem.unidadeMedida,
                          link: publicLink,
                          score: finalScore
                        });
                      }
                    }
                  });
                }
              }
            } catch (e) {
              console.error("Error fetching results:", e);
            }
          }
        });
        await Promise.all(itemPromises);
      } catch (e) {
        console.error("Error fetching items:", e);
      }
    };

    // Helper function to calculate Median
    const calculateMedian = (values: number[]) => {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    // Helper function to remove outliers (IQR Method)
    const filterOutliersIQR = (pricesObj: any[]) => {
      if (pricesObj.length < 4) return pricesObj;
      const values = pricesObj.map(p => p.price).sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      return pricesObj.filter(p => p.price >= lowerBound && p.price <= upperBound);
    };

    try {
      const translationPrompt = `
        Você é o "Cérebro" de um Motor Universal de Pesquisa de Preços Públicos.
        Sua tarefa é classificar, normalizar e expandir a descrição de itens para busca na API do PNCP.
        
        REGRAS DE CLASSIFICAÇÃO:
        - material_simples (ex: mesa, cadeira): busca genérica, foco em volume.
        - material_tecnico (ex: cabo elétrico, placa inox): extrair atributos chave (bitola, material, dimensão).
        - servico_comum (ex: limpeza): foco no escopo.
        - servico_complexo (ex: curso, consultoria): foco no verbo e contexto (80% semântico).
        
        REGRAS DE NORMALIZAÇÃO E EXPANSÃO (ANTI-CAOS PNCP):
        - Remova acentos, stopwords ("de", "para", "com") e padronize unidades (ex: "mm²" para "mm").
        - Para cada item, gere um array de "expansoes" (sinônimos e variações de busca).
        - Exemplo: "Cabo de Cobre 35mm²" -> expansoes: ["cabo cobre 35mm", "condutor cobre 35mm", "fio eletrico 35mm"]
        
        ITENS:
        ${JSON.stringify(items.map((i: any) => ({ id: i.id, desc: i.description, unit: i.unit })))}
        
        Retorne APENAS um JSON válido no seguinte formato:
        {
          "queries": [
            {
              "id": "id_do_item",
              "original": "descrição original",
              "unidade_esperada": "unidade extraída (ex: UN, M, KG)",
              "categoria": "material_simples | material_tecnico | servico_comum | servico_complexo",
              "keywords": ["palavra1", "palavra2"],
              "expansoes": [
                "busca variação 1",
                "busca variação 2",
                "busca variação 3",
                "busca variação 4"
              ]
            }
          ]
        }
      `;

      const translationResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: translationPrompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      let searchStrategies = { queries: [] };
      try {
        searchStrategies = JSON.parse(translationResponse.text || '{"queries": []}');
      } catch (e) {
        console.error("Failed to parse search strategies", e);
      }

      const processedUrls = new Set<string>();
      
      for (const strategy of searchStrategies.queries as any[]) {
        const expansoes = strategy.expansoes || [];
        let foundEnoughForThisItem = false;
        
        for (const q of expansoes) {
          if (foundEnoughForThisItem) break;
          
          const types = ['edital', 'ata', 'contrato'];
          for (const type of types) {
            if (foundEnoughForThisItem) break;

            for (let pagina = 1; pagina <= 3; pagina++) {
              try {
                const res = await fetchWithRetry(`https://pncp.gov.br/api/search/?q=${encodeURIComponent(q)}&tipos_documento=${type}&pagina=${pagina}&tam_pagina=20`);
                if (res && res.ok) {
                  const data = await res.json();
                  if (!data.items || data.items.length === 0) break;

                  const itemPromises = data.items.map(async (searchItem: any) => {
                    const url = searchItem.item_url || searchItem.url;
                    if (url && !processedUrls.has(url)) {
                      processedUrls.add(url);
                      await fetchItemsAndResults(searchItem, strategy.keywords || q.split(' '), strategy.original, type, strategy.unidade_esperada);
                    }
                  });
                  await Promise.all(itemPromises);
                  
                  const pricesForThisItem = allPrices.filter(p => p.searchedItem === strategy.original);
                  if (pricesForThisItem.length >= 10) {
                    foundEnoughForThisItem = true;
                    break;
                  }
                } else {
                  break;
                }
              } catch (e) {
                console.error(`Error searching for ${q} page ${pagina}:`, e);
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error in PNCP search process:", e);
    }

    const consolidatedPrices: any[] = [];
    const itemsGrouped = new Map<string, any[]>();
    
    allPrices.forEach(p => {
      if (!itemsGrouped.has(p.searchedItem)) itemsGrouped.set(p.searchedItem, []);
      itemsGrouped.get(p.searchedItem)!.push(p);
    });

    itemsGrouped.forEach((pricesObj, searchedItem) => {
      pricesObj.sort((a, b) => b.score - a.score);
      const topMatches = pricesObj.slice(0, 15);
      const cleanPrices = filterOutliersIQR(topMatches);
      const medianPrice = calculateMedian(cleanPrices.map(p => p.price));
      
      consolidatedPrices.push({
        item: searchedItem,
        referencia_mediana: medianPrice,
        amostras_validas: cleanPrices.length,
        descartados: topMatches.length - cleanPrices.length,
        detalhes: cleanPrices.slice(0, 5)
      });
    });

    const orgInfo = legislationConfig?.organizationName ? `ÓRGÃO: ${legislationConfig.organizationName}\n` : '';
    const customLaws = legislationConfig?.customLawsData ? `LEGISLAÇÃO E NORMATIVAS ESPECÍFICAS A OBSERVAR:\n${legislationConfig.customLawsData}\n\nATENÇÃO: Você DEVE utilizar e citar explicitamente as normativas municipais/específicas acima na metodologia do relatório em substituição ou complemento às normas federais gerais (como IN 65) quando aplicável.\n` : '';

    const prompt = `
      Você é um Assistente Especialista em Licitações Públicas.
      Sua tarefa é gerar o "Relatório de Pesquisa de Preços Públicos" completo e estruturado em Markdown, baseado estritamente nos dados reais extraídos do PNCP e saneados pelo sistema.
      
      ${orgInfo}
      ${customLaws}
      Este relatório deve servir para qualquer tipo de contratação (materiais, equipamentos, serviços) e deve seguir uma estrutura profissional, analítica e auditável, inspirada nos melhores modelos da Administração Pública.

      DADOS DO OBJETO:
      ${demandData.object}
      
      DADOS CONSOLIDADOS E SANEADOS (MÉTODO IQR E MEDIANA APLICADOS):
      ${JSON.stringify(consolidatedPrices, null, 2)}
      
      ESTRUTURA OBRIGATÓRIA DO RELATÓRIO MARKDOWN:

      # RELATÓRIO DE PESQUISA DE PREÇOS PÚBLICOS

      **1. Descrição do Objeto:**
      [Insira a descrição do objeto de forma clara]

      **2. Metodologia e Fontes Consultadas:**
      Pesquisa realizada em conformidade com a Lei nº 14.133/2021 e a Instrução Normativa SEGES/ME nº 65/2021. A coleta de dados foi realizada de forma automatizada via integração com a API do Portal Nacional de Contratações Públicas (PNCP), priorizando Atas de Registro de Preços e Contratos Administrativos. Os dados brutos passaram por saneamento estatístico (Método IQR - Intervalo Interquartil) para remoção de valores inexequíveis ou excessivamente elevados (outliers). O valor de referência final foi estipulado pela Mediana das amostras válidas.

      **3. Quadro Comparativo de Preços (Amostras Válidas):**
      [Gere uma tabela detalhada listando as principais amostras válidas (presentes no campo 'detalhes') utilizadas para compor o preço de cada item. 
      Colunas obrigatórias: Item | Órgão/Fonte | Fornecedor | Data | Valor Unitário (R$) | Link Oficial. 
      Atenção: O Link Oficial DEVE usar a sintaxe Markdown correta: [Acessar Documento](url)]

      **4. Resumo Executivo e Principais Achados:**
      [Faça uma análise qualitativa breve e inteligente dos dados coletados. Identifique a variação de preços, padrões de mercado, e características específicas. Se for serviço, mencione padrões de escopo; se for material, mencione padrões de fornecimento. Adapte a análise de forma inteligente ao tipo de objeto pesquisado.]

      **5. Tabela de Valores de Referência (Consolidada):**
      [Gere a tabela final e mais importante, consolidando os valores que serão usados na licitação. 
      Colunas obrigatórias: Item | Qtd. Amostras Válidas | Amostras Descartadas (Outliers) | Valor de Referência (Mediana - R$).]

      **6. Conclusão Final:**
      Ficam estipulados os valores de referência consolidados na tabela acima para a futura contratação, atestando-se a conformidade com as boas práticas e a legislação vigente para a obtenção de preços de mercado justos, coesos e vantajosos para a Administração Pública.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: this._buildContentsWithDocuments(prompt, legislationConfig?.uploadedDocuments),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        tools: legislationConfig?.enableSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    return response.text;
  },

  // ==========================================
  // NOVO MOTOR DE BUSCA OTIMIZADO E ESTRUTURADO (MULTI-TIERED SCORES & LINKS OFICIAIS PNCP CORRIGIDOS)
  // ==========================================
  async performPriceResearch(demandData: any, items: any[], legislationConfig?: any) {
    const query = demandData.object;
    let allPrices: any[] = [];
    
    const fetchWithProxy = async (url: string) => {
      const proxyUrl = `/api/pncp-proxy?url=${encodeURIComponent(url)}`;
      return fetch(proxyUrl);
    };

    const fetchWithRetry = async (url: string, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetchWithProxy(url);
          if (res.ok) return res;
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      return null;
    };

    const fetchItemsAndResults = async (strategy: any, item: any, searchKeywords: string[], originalDescription: string, documentType: string, expectedUnit: string) => {
      const url = item.item_url || item.url;
      if (!url) return;

      const parts = url.split('/').filter(Boolean);
      let orgao_cnpj = '';
      let ano = '';
      let sequencial = ''; // sequencial compra
      let sequencial_ata = ''; // sequencial ata
      let sequencial_contrato = ''; // sequencial contrato

      if (parts[0] === 'compras') {
        orgao_cnpj = parts[1] || '';
        ano = parts[2] || '';
        sequencial = parts[3] || '';
      } else if (parts[0] === 'atas') {
        orgao_cnpj = parts[1] || '';
        ano = parts[2] || '';
        sequencial = parts[3] || '';
        sequencial_ata = parts[4] || '';
      } else if (parts[0] === 'contratos') {
        orgao_cnpj = parts[1] || '';
        ano = parts[2] || '';
        sequencial_contrato = parts[3] || '';
        
        try {
          const contratoRes = await fetchWithRetry(`https://pncp.gov.br/api/pncp/v1/orgaos/${orgao_cnpj}/contratos/${ano}/${sequencial_contrato}`);
          if (contratoRes) {
            const contrato = await contratoRes.json();
            const compraControl = contrato.numeroControlePncpCompra || contrato.numeroControlePncpAta || '';
            if (compraControl && compraControl.includes('-')) {
              const partsControl = compraControl.split('-');
              if (partsControl.length >= 3) {
                orgao_cnpj = partsControl[0];
                const seqAndYear = partsControl[2].split('/');
                if (seqAndYear.length === 2) {
                  const rawSeq = seqAndYear[0];
                  if (/^\d+$/.test(rawSeq)) {
                    sequencial = String(parseInt(rawSeq, 10));
                  } else {
                    sequencial = rawSeq;
                  }
                  ano = seqAndYear[1];
                }
              }
            }
          }
        } catch (e) {
          console.error("Error loading contract details:", e);
        }

        if (!sequencial) {
          sequencial = sequencial_contrato;
        }
      }

      // Robust fallback for safety
      if (!orgao_cnpj || !ano) {
        const orgaosIdx = parts.indexOf('orgaos');
        if (orgaosIdx !== -1 && orgaosIdx + 1 < parts.length) {
          orgao_cnpj = parts[orgaosIdx + 1];
        } else {
          orgao_cnpj = parts[1] || '';
        }
        const yearFind = parts.find(p => /^\d{4}$/.test(p));
        if (yearFind) {
          ano = yearFind;
        } else {
          ano = parts[2] || '';
        }
      }
      
      if (!orgao_cnpj || !ano || !sequencial) return;

      try {
        const itensRes = await fetchWithRetry(`https://pncp.gov.br/api/pncp/v1/orgaos/${orgao_cnpj}/compras/${ano}/${sequencial}/itens`);
        if (!itensRes) return;
        const pncpItens = await itensRes.json();
        
        const itemPromises = pncpItens.map(async (compraItem: any) => {
          // UNIQUE_ACTIVE_INDICATOR_1
          const itemDesc = (compraItem.descricao || "").toLowerCase();
          const resultUnit = (compraItem.unidadeMedida || "").toLowerCase();
          
          // SISTEMA DE SCORE MULTI-TIERED (Evita diluição de especificação e trata acentuação/diacríticos)
          let textScore = 0;
          
          // Função auxiliar de normalização de texto (remove acentos/cedilhas)
          const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const cleanDesc = normalizeStr(itemDesc);
          
          if (strategy.termo_principal) {
            const cleanTerm = normalizeStr(strategy.termo_principal);
            let primaryScore = 0;
            
            if (cleanDesc.includes(cleanTerm)) {
              primaryScore = 1.0;
            } else {
              // Verifica se contém a maior parte das palavras do termo principal
              const termWords = cleanTerm.split(' ').filter(w => w.length > 2);
              if (termWords.length > 0) {
                const matchedWords = termWords.filter(w => cleanDesc.includes(w)).length;
                primaryScore = matchedWords / termWords.length;
              } else {
                primaryScore = 1.0;
              }
            }
            
            // Peso base do termo principal: 50%
            textScore += primaryScore * 0.5;
            
            // Atributos Obrigatórios/Críticos (material, dimensões) - Peso 40%
            const obrigat = strategy.atributos_obrigatorios || [];
            let matchedObrigat = 0;
            
            if (obrigat.length > 0) {
              obrigat.forEach((attr: string) => {
                const cleanAttr = normalizeStr(attr);
                if (cleanDesc.includes(cleanAttr)) {
                  matchedObrigat++;
                } else {
                  // Tenta sem espaços (ex: "80x80" vs "80 x 80")
                  const noSpacesAttr = cleanAttr.replace(/\s+/g, '');
                  const noSpacesDesc = cleanDesc.replace(/\s+/g, '');
                  if (noSpacesDesc.includes(noSpacesAttr)) {
                    matchedObrigat++;
                  } else {
                    // Tenta todas as palavras maiores do atributo crítico
                    const attrWords = cleanAttr.split(' ').filter(w => w.length > 2);
                    if (attrWords.length > 0 && attrWords.every(w => cleanDesc.includes(w))) {
                      matchedObrigat++;
                    }
                  }
                }
              });
              
              textScore += (matchedObrigat / obrigat.length) * 0.4;
              
              // Penalidade severa caso não bata nenhum dos atributos críticos exigidos pelo usuário
              if (matchedObrigat === 0) {
                textScore *= 0.5;
              }
            } else {
              textScore += 0.4;
            }
            
            // Atributos Opcionais (cor, acabamento secundário) - Peso 10%
            const opcionais = strategy.atributos_opcionais || [];
            if (opcionais.length > 0) {
              let matchedOpcionais = 0;
              opcionais.forEach((attr: string) => {
                const cleanAttr = normalizeStr(attr);
                if (cleanDesc.includes(cleanAttr)) {
                  matchedOpcionais++;
                }
              });
              textScore += (matchedOpcionais / opcionais.length) * 0.1;
            } else {
              textScore += 0.1;
            }
            
          } else {
            // Fallback robusto para retrocompatibilidade
            if (searchKeywords.length > 0) {
              const matchCount = searchKeywords.filter(k => cleanDesc.includes(normalizeStr(k))).length;
              textScore = matchCount / searchKeywords.length;
            } else {
              textScore = 1;
            }
          }

          let unitScore = 0.5; // Default neutral
          if (expectedUnit && resultUnit) {
            const expU = expectedUnit.toLowerCase();
            const resU = resultUnit.toLowerCase();
            if (expU === resU) unitScore = 1.0;
            else if (['m', 'metro', 'metros'].includes(expU) && ['m', 'metro', 'metros'].includes(resU)) unitScore = 1.0;
            else if (['un', 'und', 'unidade', 'unid'].includes(expU) && ['un', 'und', 'unidade', 'unid'].includes(resU)) unitScore = 1.0;
            else unitScore = 0.0; // Penalty for mismatch
          } else {
            unitScore = 0.8; // Slightly positive if missing
          }

          // Final Score: 70% Text, 30% Unit
          const finalScore = (textScore * 0.7) + (unitScore * 0.3);

          if (finalScore >= 0.6 && compraItem.temResultado) {
            try {
              const resultadosRes = await fetchWithRetry(`https://pncp.gov.br/api/pncp/v1/orgaos/${orgao_cnpj}/compras/${ano}/${sequencial}/itens/${compraItem.numeroItem}/resultados`);
              if (resultadosRes) {
                const resultados = await resultadosRes.json();
                if (resultados && resultados.length > 0) {
                  resultados.forEach((res: any) => {
                    if (allPrices.length < 300) { 
                      // LINKS OFICIAIS CORRIGIDOS DO PNCP (Geração direta sem redirecionamentos de busca)
                      const cleanNum = (str: string) => {
                        if (!str) return '';
                        const cleaned = str.trim();
                        if (/^\d+$/.test(cleaned)) {
                          return String(parseInt(cleaned, 10));
                        }
                        return cleaned;
                      };

                      const cnpjClean = (orgao_cnpj || '').trim();
                      const anoClean = (ano || '').trim();
                      const seqCompraClean = cleanNum(sequencial);
                      const seqAtaClean = cleanNum(sequencial_ata);
                      const seqContratoClean = cleanNum(sequencial_contrato);

                      let publicLink = '';
                      if (documentType === 'ata') {
                        if (cnpjClean && anoClean && seqCompraClean && seqAtaClean) {
                          publicLink = `https://pncp.gov.br/app/atas/${cnpjClean}/${anoClean}/${seqCompraClean}/${seqAtaClean}`;
                        } else {
                          publicLink = `https://pncp.gov.br/app/atas/${cnpjClean}/${anoClean}/${seqCompraClean}`;
                        }
                      } else if (documentType === 'contrato') {
                        if (cnpjClean && anoClean && seqContratoClean) {
                          publicLink = `https://pncp.gov.br/app/contratos/${cnpjClean}/${anoClean}/${seqContratoClean}`;
                        } else {
                          publicLink = `https://pncp.gov.br/app/contratos/${cnpjClean}/${anoClean}/${seqCompraClean}`;
                        }
                      } else {
                        // Edital / Compra
                        publicLink = `https://pncp.gov.br/app/editais/1/${cnpjClean}/${anoClean}/${seqCompraClean}`;
                      }

                      const priceValue = res.valorUnitarioHomologado || res.valorUnitarioEstimado || compraItem.valorUnitarioEstimado;
                      
                      if (priceValue > 0) {
                        allPrices.push({
                          source: `PNCP - ${item.orgao_nome || 'Órgão'}`,
                          supplier: res.nomeRazaoSocialFornecedor,
                          date: res.dataResultado,
                          price: priceValue,
                          description: compraItem.descricao,
                          searchedItem: originalDescription,
                          unit: compraItem.unidadeMedida,
                          link: publicLink,
                          score: finalScore
                        });
                      }
                    }
                  });
                }
              }
            } catch (e) {
              console.error("Error fetching results:", e);
            }
          }
        });
        await Promise.all(itemPromises);
      } catch (e) {
        console.error("Error fetching items:", e);
      }
    };

    // Helper function to calculate Median
    const calculateMedian = (values: number[]) => {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    // Helper function to remove outliers (IQR Method)
    const filterOutliersIQR = (pricesObj: any[]) => {
      if (pricesObj.length < 4) return pricesObj;
      const values = pricesObj.map(p => p.price).sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      return pricesObj.filter(p => p.price >= lowerBound && p.price <= upperBound);
    };

    try {
      // 1. Tradução da descrição humana para estrutura de termos do PNCP (Normalização contra ruídos)
      const translationPrompt = `
        Você é o "Cérebro" de um Motor Universal de Pesquisa de Preços Públicos.
        Sua tarefa é classificar, normalizar e expandir a descrição de itens para busca na API do PNCP.
        
        REGRAS DE CLASSIFICAÇÃO:
        - material_simples (ex: mesa, cadeira): busca genérica, foco em volume.
        - material_tecnico (ex: cabo elétrico, placa inox): extrair atributos chave (bitola, material, dimensão).
        - servico_comum (ex: limpeza): foco no escopo.
        - servico_complexo (ex: curso, consultoria): foco no verbo e contexto (80% semântico).
        
        REGRAS DE NORMALIZAÇÃO E EXTRAÇÃO ESTRUTURADA (EVITAR DILUIÇÃO DE ESPECIFICAÇÃO):
        - Para evitar que descrições longas e detalhadas tenham score baixo devido a excesso de detalhes secundários, separe a descrição em três níveis estruturados:
          1. termo_principal: O termo de busca básico, substantivo e direto do produto (ex: "placa inauguracao", "cabo cobre").
          2. atributos_obrigatorios: Um array de strings com 2 a 4 atributos essenciais, físicos ou de material, cruciais para que haja equivalência do item (ex: ["aluminio fundido", "80x80"], ["cobre", "35mm"]).
          3. atributos_opcionais: Um array de detalhes secundários que complementam a descrição, mas que não devem desclassificar o item por si só (ex: ["alto relevo", "brasao republica", "pintura automotiva"]).
        - Remova acentos, stopwords ("de", "para", "com") e padronize unidades (ex: "mm²" para "mm", "80cm x 80cm" para "80x80").
        - Para cada item, gere um array de "expansoes" contendo de 3 a 5 variações curtas e eficientes de termos de busca que o portal do PNCP indexaria (não use frases longas no termo de busca, pois o PNCP retornará 0 resultados).
        
        ITENS:
        ${JSON.stringify(items.map((i: any) => ({ id: i.id, desc: i.description, unit: i.unit })))}
        
        Retorne APENAS um JSON válido no seguinte formato:
        {
          "queries": [
            {
              "id": "id_do_item",
              "original": "descrição original",
              "unidade_esperada": "unidade extraída (ex: UN, M, KG)",
              "categoria": "material_simples | material_tecnico | servico_comum | servico_complexo",
              "termo_principal": "termo essencial (ex: placa inauguracao)",
              "atributos_obrigatorios": ["atributo de material ou dimensão 1", "atributo 2"],
              "atributos_opcionais": ["atributo de acabamento ou cor 1", "atributo 2"],
              "keywords": ["palavra1", "palavra2"], // Mantenha todas por retrocompatibilidade
              "expansoes": [
                "busca variação curta 1",
                "busca variação curta 2",
                "busca variação curta 3"
              ]
            }
          ]
        }
      `;

      const translationResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: translationPrompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      let searchStrategies = { queries: [] };
      try {
        searchStrategies = JSON.parse(translationResponse.text || '{"queries": []}');
      } catch (e) {
        console.error("Failed to parse search strategies", e);
      }

      const processedUrls = new Set<string>();
      
      // 2. Executa a Busca Multi-Query por Termos de Expansão no PNCP
      for (const strategy of searchStrategies.queries as any[]) {
        const expansoes = strategy.expansoes || [];
        let foundEnoughForThisItem = false;
        
        for (const q of expansoes) {
          if (foundEnoughForThisItem) break;
          
          const types = ['edital', 'ata', 'contrato'];
          for (const type of types) {
            if (foundEnoughForThisItem) break;

            // Busca nas primeiras páginas
            for (let pagina = 1; pagina <= 3; pagina++) {
              try {
                const res = await fetchWithRetry(`https://pncp.gov.br/api/search/?q=${encodeURIComponent(q)}&tipos_documento=${type}&pagina=${pagina}&tam_pagina=20`);
                if (res && res.ok) {
                  const data = await res.json();
                  if (!data.items || data.items.length === 0) break;

                  const itemPromises = data.items.map(async (searchItem: any) => {
                    const url = searchItem.item_url || searchItem.url;
                    if (url && !processedUrls.has(url)) {
                      processedUrls.add(url);
                      await fetchItemsAndResults(strategy, searchItem, strategy.keywords || q.split(' '), strategy.original, type, strategy.unidade_esperada);
                    }
                  });
                  await Promise.all(itemPromises);
                  
                  const pricesForThisItem = allPrices.filter(p => p.searchedItem === strategy.original);
                  if (pricesForThisItem.length >= 12) {
                    foundEnoughForThisItem = true;
                    break;
                  }
                } else {
                  break;
                }
              } catch (e) {
                console.error(`Error searching for ${q} page ${pagina}:`, e);
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error in PNCP search process:", e);
    }

    // 3. Consolidação de Preços e Remoção Programática de Outliers (IQR + Mediana)
    const consolidatedPrices: any[] = [];
    const itemsGrouped = new Map<string, any[]>();
    
    allPrices.forEach(p => {
      if (!itemsGrouped.has(p.searchedItem)) itemsGrouped.set(p.searchedItem, []);
      itemsGrouped.get(p.searchedItem)!.push(p);
    });

    itemsGrouped.forEach((pricesObj, searchedItem) => {
      // Ordena por score descendente
      pricesObj.sort((a, b) => b.score - a.score);
      // Pega até as 15 maiores pontuações para saneamento
      const topMatches = pricesObj.slice(0, 15);
      // Remove Outliers por IQR
      const cleanPrices = filterOutliersIQR(topMatches);
      // Calcula Mediana de Referência
      const medianPrice = calculateMedian(cleanPrices.map(p => p.price));
      
      consolidatedPrices.push({
        item: searchedItem,
        referencia_mediana: medianPrice,
        amostras_validas: cleanPrices.length,
        descartados: topMatches.length - cleanPrices.length,
        detalhes: cleanPrices.slice(0, 5) // Envia as top 5 amostras limpas e válidas para o relatório
      });
    });

    // 4. Geração do Relatório Final de Pesquisa de Preços (LLM)
    const orgInfo = legislationConfig?.organizationName ? `ÓRGÃO: ${legislationConfig.organizationName}\n` : '';
    const customLaws = legislationConfig?.customLawsData ? `LEGISLAÇÃO E NORMATIVAS ESPECÍFICAS A OBSERVAR:\n${legislationConfig.customLawsData}\n\nATENÇÃO: Você DEVE utilizar e citar explicitamente as normativas municipais/específicas acima na metodologia do relatório em substituição ou complemento às normas federais gerais (como IN 65) quando aplicável.\n` : '';

    const prompt = `
      Você é um Assistente Especialista em Licitações Públicas.
      Sua tarefa é gerar o "Relatório de Pesquisa de Preços Públicos" completo e estruturado em Markdown, baseado estritamente nos dados reais extraídos do PNCP e saneados pelo sistema.
      
      ${orgInfo}
      ${customLaws}
      Este relatório deve servir para qualquer tipo de contratação (materiais, equipamentos, serviços) e deve seguir uma estrutura profissional, analítica e auditável, inspirada nos melhores modelos da Administração Pública.

      DADOS DO OBJETO:
      ${demandData.object}
      
      DADOS CONSOLIDADOS E SANEADOS (MÉTODO IQR E MEDIANA APLICADOS):
      ${JSON.stringify(consolidatedPrices, null, 2)}
      
      ESTRUTURA OBRIGATÓRIA DO RELATÓRIO MARKDOWN:

      # RELATÓRIO DE PESQUISA DE PREÇOS PÚBLICOS

      **1. Descrição do Objeto:**
      [Insira a descrição do objeto de forma clara]

      **2. Metodologia e Fontes Consultadas:**
      Pesquisa realizada em conformidade com a Lei nº 14.133/2021 e a Instrução Normativa SEGES/ME nº 65/2021. A coleta de dados foi realizada de forma automatizada via integração com a API do Portal Nacional de Contratações Públicas (PNCP), priorizando Atas de Registro de Preços e Contratos Administrativos. Os dados brutos passaram por saneamento estatístico (Método IQR - Intervalo Interquartil) para remoção de valores inexequíveis ou excessivamente elevados (outliers). O valor de referência final foi estipulado pela Mediana das amostras válidas.

      **3. Quadro Comparativo de Preços (Amostras Válidas):**
      [Gere uma tabela detalhada listando as principais amostras válidas (presentes no campo 'detalhes') utilizadas para compor o preço de cada item. 
      Colunas obrigatórias: Item | Órgão/Fonte | Fornecedor | Data | Valor Unitário (R$) | Link Oficial. 
      Atenção: O Link Oficial DEVE usar o link exato e íntegro do campo 'link' correspondente a cada amostra em 'detalhes'. Não altere ou abrevie este link sob nenhuma hipótese. O Link Oficial DEVE usar a sintaxe Markdown correta: [Visualizar no PNCP](url)]

      **4. Resumo Executivo e Principais Achados:**
      [Faça uma análise qualitativa breve e inteligente dos dados coletados. Identifique a variação de preços, padrões de mercado, e características específicas. Se for serviço, mencione padrões de escopo; se for material, mencione padrões de fornecimento. Adapte a análise de forma inteligente ao tipo de objeto pesquisado.]

      **5. Tabela de Valores de Referência (Consolidada):**
      [Gere a tabela final e mais importante, consolidando os valores que serão usados na licitação. 
      Colunas obrigatórias: Item | Qtd. Amostras Válidas | Amostras Descartadas (Outliers) | Valor de Referência (Mediana - R$).]

      **6. Conclusão Final:**
      Ficam estipulados os valores de referência consolidados na tabela acima para a futura contratação, atestando-se a conformidade com as boas práticas e a legislação vigente para a obtenção de preços de mercado justos, coesos e vantajosos para a Administração Pública.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: this._buildContentsWithDocuments(prompt, legislationConfig?.uploadedDocuments),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        tools: legislationConfig?.enableSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    return response.text;
  },

  async generateTR(demandData: any, items: any[], etpContent: string, priceResearchContent: string, legislationConfig?: any) {
    const orgInfo = legislationConfig?.organizationName ? `ÓRGÃO: ${legislationConfig.organizationName}\n` : '';
    const customLaws = legislationConfig?.customLawsData ? `LEGISLAÇÃO E NORMATIVAS ESPECÍFICAS A OBSERVAR:\n${legislationConfig.customLawsData}\n\nATENÇÃO: Você DEVE utilizar e citar explicitamente as normativas municipais/específicas acima em substituição ou complemento às normas federais gerais (como IN 65 e IN 58) quando aplicável.\n` : '';

    const prompt = `
      Com base no ETP e na Pesquisa de Preços, gere um Termo de Referência (TR) completo, em formato Markdown.
      
      ${orgInfo}
      ${customLaws}
      DADOS DA DEMANDA:
      - Objeto: ${demandData.object}
      
      ITENS DA CONTRATAÇÃO:
      ${JSON.stringify(items, null, 2)}
      
      ETP APROVADO:
      ${etpContent.substring(0, 2000)}... (resumido)
      
      PESQUISA DE PREÇOS:
      ${priceResearchContent}
      
      ESTRUTURA ESPERADA DO TR:
      1. Definição do Objeto
      2. Fundamentação da Contratação
      3. Descrição da Solução
      4. Requisitos da Contratação
      5. Modelo de Execução do Objeto
      6. Modelo de Gestão do Contrato
      7. Critérios de Medição e Pagamento
      8. Forma e Critérios de Seleção do Fornecedor
      9. Estimativas do Valor da Contratação
      10. Adequação Orçamentária
      
      Gere apenas o conteúdo do documento em Markdown, utilizando as regras e formatações legais da legislação aplicável fornecida no contexto.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: this._buildContentsWithDocuments(prompt, legislationConfig?.uploadedDocuments),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        tools: legislationConfig?.enableSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    return response.text;
  },

  async auditProcess(demandData: any, dfd: string, etp: string, tr: string, priceResearch: string, legislationConfig?: any) {
    const orgInfo = legislationConfig?.organizationName ? `ÓRGÃO: ${legislationConfig.organizationName}\n` : '';
    const customLaws = legislationConfig?.customLawsData ? `LEGISLAÇÃO E NORMATIVAS ESPECÍFICAS A OBSERVAR:\n${legislationConfig.customLawsData}\n\nATENÇÃO: A auditoria DEVE priorizar as normativas municipais/específicas acima em substituição ou complemento às normas federais gerais.\n` : '';

    const prompt = `
      Realize uma auditoria de conformidade legal rigorosa e completa em todos os documentos gerados para este processo licitatório.
      
      ${orgInfo}
      ${customLaws}
      Critério primário (se fornecido): Legislação e Normativas Específicas do Órgão.
      Critério Secundário/Subsidiário: Lei 14.133/2021, INs federais (IN 65/2021) e jurisprudência do TCU.
      
      DADOS DA DEMANDA:
      OBJETO: ${demandData.object}
      JUSTIFICATIVA: ${demandData.justification}

      --- DOCUMENTOS PARA ANÁLISE ---

      1. PESQUISA DE PREÇOS:
      ${priceResearch}

      2. DFD (Documento de Formalização de Demanda):
      ${dfd}

      3. ETP (Estudo Técnico Preliminar):
      ${etp}

      4. TR (Termo de Referência):
      ${tr}
      
      --- INSTRUÇÕES DE AUDITORIA ---

      Verifique rigorosamente:
      1. Coerência do Processo: O TR está alinhado com o ETP e o DFD? O objeto está bem definido em todos?
      2. Pesquisa de Preços (CRÍTICO): Analise se os valores de referência estão bem fundamentados. 
         - Verifique se a metodologia foi explicada.
         - Se houver dados simulados ou insuficientes, aponte como uma NÃO CONFORMIDADE CRÍTICA.
      3. Fundamentação Legal: Os documentos citam as normativas corretas e específicas do Órgão?
      4. Riscos e Erros Comuns: Há indícios de sobrepreço, restrição à competitividade (direcionamento) ou justificativas genéricas?
      5. Estrutura Obrigatória: Todos os elementos exigidos estão presentes nos artefatos?

      Gere um Relatório de Auditoria Profissional em Markdown, com as seções:
      - INTRODUÇÃO (Confirme que todos os documentos foram analisados)
      - ANÁLISE DE CONFORMIDADE (Destaque o que está correto à luz das normativas do órgão e da lei complementar)
      - NÃO CONFORMIDADES E RISCOS (Se houver)
      - RECOMENDAÇÕES DE MELHORIA
      - CONCLUSÃO FINAL (Atestando a viabilidade ou não do processo)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: this._buildContentsWithDocuments(prompt, legislationConfig?.uploadedDocuments),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        tools: legislationConfig?.enableSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    return response.text;
  }
};
